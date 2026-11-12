// Verifies the live production deploy after each promotion. Node APIs only.
// Expected headers are read from public/_headers, so this script follows policy changes.
//
// Usage:
//   SITE_URL=https://<production-host> node scripts/verify-deploy.ts
//   EXPECTED_SHA=<commit> waits until production serves that commit before checking.
import { readFile } from 'node:fs/promises';
import { parseHeadersFile } from '../src/lib/headers.ts';

const POLL_INTERVAL_MS = 15_000;
let passed = 0;
let failed = 0;

function fail(message: string): never {
  console.error(`✗ ${message}`);
  process.exit(1);
}

const siteUrl = (process.env['SITE_URL'] ?? '').replace(/\/+$/, '');
if (!siteUrl.startsWith('https://')) fail('SITE_URL must be an https URL (repo variable in CI).');
const expectedSha = (process.env['EXPECTED_SHA'] ?? '').slice(0, 7);
const timeoutMs = Number(process.env['VERIFY_TIMEOUT_MS'] ?? 15 * 60_000);
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// fetch() wraps DNS and TLS failures in a generic "fetch failed"; the cause names the real problem.
function describeError(error: unknown): string {
  const cause = error instanceof Error ? error.cause : undefined;
  if (!(cause instanceof Error)) return String(error);
  const code = (cause as NodeJS.ErrnoException).code;
  return `${String(error)} (${code ? `${code}: ` : ''}${cause.message})`;
}

function check(name: string, ok: boolean, detail = ''): void {
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? '✓' : '✗'} ${name}${detail ? ` (${detail})` : ''}`);
}

/** GET without following redirects, cache-busted so a stale response is never read. */
async function get(path: string): Promise<Response> {
  const url = new URL(path, `${siteUrl}/`);
  url.searchParams.set('bust', Date.now().toString());
  return fetch(url, { redirect: 'manual', headers: { 'cache-control': 'no-cache' } });
}

function checkHeaders(label: string, response: Response, expected: Map<string, string>): void {
  for (const [name, value] of expected) {
    const actual = response.headers.get(name);
    check(
      `${label}: ${name}`,
      actual === value,
      actual === value ? '' : `expected "${value}", got "${actual ?? 'missing'}"`,
    );
  }
}

async function waitForDeploy(): Promise<void> {
  if (!expectedSha) {
    console.log('EXPECTED_SHA empty: checking whatever is live.');
    return;
  }
  const deadline = Date.now() + timeoutMs;
  let seen = '';
  while (Date.now() < deadline) {
    try {
      const html = await (await get('/')).text();
      seen = /data-build-sha[^>]*>([^<]+)</.exec(html)?.[1]?.trim() ?? '(no build marker)';
      if (seen === expectedSha) {
        console.log(`✓ Production serves ${expectedSha}`);
        return;
      }
    } catch (error) {
      seen = `network error: ${describeError(error)}`;
    }
    console.log(`… production serves ${seen}; waiting for ${expectedSha}`);
    await sleep(POLL_INTERVAL_MS);
  }
  fail(
    `${expectedSha} not live after ${timeoutMs / 1000} s (last seen: ${seen}). Check Workers Builds.`,
  );
}

async function observatoryGrade(host: string): Promise<string> {
  const endpoint = `https://observatory-api.mdn.mozilla.net/api/v2/scan?host=${encodeURIComponent(host)}`;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch(endpoint, { method: 'POST' });
      const body = (await response.json()) as { grade?: string | null; error?: string | null };
      if (body.grade) return body.grade;
      console.log(
        `… Observatory has no grade yet (attempt ${attempt}): ${body.error ?? response.status}`,
      );
    } catch (error) {
      console.log(`… Observatory unreachable (attempt ${attempt}): ${describeError(error)}`);
    }
    await sleep(POLL_INTERVAL_MS);
  }
  return 'none after 3 attempts';
}

const rules = parseHeadersFile(
  await readFile(new URL('../public/_headers', import.meta.url), 'utf8'),
);
const pageHeaders = rules.get('/*') ?? fail('public/_headers has no /* rule');
const assetHeaders = rules.get('/_astro/*') ?? new Map<string, string>();

// 1. Production serves the commit that passed the gates.
await waitForDeploy();

// 2. Pages: status, security headers, per-page CSP.
let homeHtml = '';
for (const path of ['/', '/en/']) {
  const response = await get(path);
  const html = await response.text();
  if (path === '/') homeHtml = html;
  check(`${path} returns 200`, response.status === 200, `status ${response.status}`);
  checkHeaders(path, response, pageHeaders);
  check(
    `${path} has Astro CSP with script hashes`,
    /<meta http-equiv="content-security-policy"[^>]*script-src[^>]*'sha256-/i.test(html),
  );
}

// 3. 404 is the custom page, with status 404 and the same headers.
const missing = await get('/route-that-does-not-exist/');
check('Unknown route returns 404', missing.status === 404, `status ${missing.status}`);
check('404 is the custom page', /<html lang="es/i.test(await missing.text()));
checkHeaders('404', missing, pageHeaders);

// 4. On-demand (Worker) responses carry the same headers, via src/middleware.ts.
const action = await fetch(new URL('/_actions/contact', `${siteUrl}/`), {
  method: 'POST',
  headers: { origin: siteUrl, 'content-type': 'application/json' },
  body: '{}',
});
check('/_actions/contact is served by the Worker', action.status < 500, `status ${action.status}`);
checkHeaders('/_actions/contact', action, pageHeaders);

// 5. Hashed assets are served with immutable caching.
const assetPath = /(\/_astro\/[^"'\s)]+\.(?:css|js|woff2))/.exec(homeHtml)?.[1];
if (assetPath) {
  const asset = await get(assetPath);
  check(`${assetPath} returns 200`, asset.status === 200, `status ${asset.status}`);
  checkHeaders(assetPath, asset, assetHeaders);
} else {
  check('At least one hashed asset under /_astro/', false, 'none found in / HTML');
}

// 6. Independent external grade.
const grade = await observatoryGrade(new URL(siteUrl).host);
check('MDN HTTP Observatory is A+', grade === 'A+', `grade ${grade}`);

if (failed > 0) fail(`${failed} of ${passed + failed} checks failed on ${siteUrl}`);
console.log(`✓ ${passed} checks passed on ${siteUrl}`);
