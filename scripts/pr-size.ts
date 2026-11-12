// PR size gate: counts changed lines (additions + deletions) against the base, lockfiles excluded.
//   <= 550: pass. 551-660: warning; the PR body needs a non-empty "Size justification" section.
//   > 660: fail; split the PR.
// Usage (CI): BASE_SHA=<sha> HEAD_SHA=<sha> PR_BODY=<text> node scripts/pr-size.ts
import { execFileSync } from 'node:child_process';

export const LIMIT = 550;
export const HARD_LIMIT = 660;
const LOCKFILES = /(^|\/)(pnpm-lock\.yaml|package-lock\.json|yarn\.lock)$/;

/** Sums `git diff --numstat` output. Binary files ("-") count as 0. */
export function countLines(numstat: string): number {
  let total = 0;
  for (const line of numstat.split('\n')) {
    const [added, deleted, path] = line.split('\t');
    if (!path || LOCKFILES.test(path)) continue;
    total += (Number(added) || 0) + (Number(deleted) || 0);
  }
  return total;
}

/** True when the body has a "Size justification" heading followed by non-empty text. */
export function hasJustification(body: string): boolean {
  const match = /^#+\s*Size justification\s*$([\s\S]*?)(?=^#+\s|(?![\s\S]))/im.exec(body);
  let text = match?.[1] ?? '';
  // Repeat until stable: one pass can leave a new comment opener behind.
  let prev;
  do {
    prev = text;
    text = text.replace(/<!--[\s\S]*?-->/g, '');
  } while (text !== prev);
  text = text.trim();
  return text.length > 0;
}

export function verdict(lines: number, body: string): { ok: boolean; message: string } {
  if (lines <= LIMIT) return { ok: true, message: `${lines} lines (limit ${LIMIT}).` };
  if (lines > HARD_LIMIT) {
    return { ok: false, message: `${lines} lines exceeds ${HARD_LIMIT}. Split the PR.` };
  }
  return hasJustification(body)
    ? { ok: true, message: `${lines} lines is over ${LIMIT}; justified in the PR body.` }
    : {
        ok: false,
        message: `${lines} lines is over ${LIMIT}. Add a "Size justification" section.`,
      };
}

if (import.meta.main) {
  const { BASE_SHA, HEAD_SHA = 'HEAD', PR_BODY = '' } = process.env;
  if (!BASE_SHA) throw new Error('BASE_SHA is required.');
  const numstat = execFileSync('git', ['diff', '--numstat', `${BASE_SHA}...${HEAD_SHA}`], {
    encoding: 'utf8',
  });
  const { ok, message } = verdict(countLines(numstat), PR_BODY);
  const level = !ok ? 'error' : message.includes('over') ? 'warning' : 'notice';
  console.log(`::${level} title=PR size::${message}`);
  if (!ok) process.exit(1);
}
