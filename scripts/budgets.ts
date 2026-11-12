// Page budgets on the build output: ≤20 KB gzipped JavaScript per page, home page ≤400 KB.
// JS = inline scripts + every /_astro/*.js a page loads, imports included. Home weight = the
// HTML plus every local asset it references (text gzipped, binaries raw).
// Usage (CI, after the build): node scripts/budgets.ts
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';

export const JS_LIMIT = 20 * 1024;
export const HOME_LIMIT = 400 * 1024;

/** Null when within budget, else a message naming the page and the overage. */
export function overBudget(page: string, what: string, bytes: number, limit: number) {
  if (bytes <= limit) return null;
  const kb = (n: number) => (n / 1024).toFixed(1);
  return `${page}: ${what} is ${kb(bytes)} KB, ${kb(bytes - limit)} KB over the ${kb(limit)} KB budget.`;
}

const root = 'dist/client';
const gz = (data: string | Buffer) => gzipSync(data).length;
const size = (file: string) =>
  /\.(js|css|svg|html)$/.test(file) ? gz(readFileSync(file)) : readFileSync(file).length;

/** A JS file and everything it imports statically, as paths under the build root. */
function jsGraph(file: string, seen = new Set<string>()): Set<string> {
  if (seen.has(file) || !existsSync(file)) return seen;
  seen.add(file);
  for (const [, spec] of readFileSync(file, 'utf8').matchAll(
    /(?:import|from)\s*["']([^"']+\.js)["']/g,
  )) {
    if (spec) jsGraph(join(file, '..', spec), seen);
  }
  return seen;
}

function check(html: string): string[] {
  const page = `/${relative(root, html)
    .replace(/\\/g, '/')
    .replace(/index\.html$/, '')}`;
  const markup = readFileSync(html, 'utf8');
  const local = [...markup.matchAll(/(?:src|href)="(\/_astro\/[^"?#]+)"/g)].map(([, p]) =>
    join(root, p ?? ''),
  );
  const js = new Set<string>();
  for (const file of local.filter((f) => f.endsWith('.js'))) jsGraph(file, js);
  // Inline scripts, except JSON-LD data blocks.
  const inline = [
    ...markup.matchAll(
      /<script(?![^>]*\b(?:src=|type="application\/ld\+json"))[^>]*>([\s\S]*?)<\/script>/g,
    ),
  ]
    .map(([, body]) => body ?? '')
    .join('');
  const jsBytes = [...js].reduce((sum, f) => sum + size(f), inline ? gz(inline) : 0);
  console.log(`${page}: JavaScript ${(jsBytes / 1024).toFixed(1)} KB`);
  const problems = [overBudget(page, 'JavaScript', jsBytes, JS_LIMIT)];
  if (page === '/') {
    const assets = new Set([...local.filter((f) => existsSync(f)), ...js]);
    const total = [...assets].reduce((sum, f) => sum + size(f), size(html));
    console.log(`${page}: page weight ${(total / 1024).toFixed(1)} KB`);
    problems.push(overBudget(page, 'page weight', total, HOME_LIMIT));
  }
  return problems.filter((p) => p !== null);
}

if (import.meta.main) {
  const pages = readdirSync(root, { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.html'))
    .map((f) => join(root, f));
  if (pages.length === 0) throw new Error(`No pages in ${root}. Run the build first.`);
  const problems = pages.flatMap(check);
  for (const p of problems) console.error(p);
  if (problems.length > 0) process.exit(1);
  console.log(`Budgets OK on ${pages.length} pages.`);
}
