/** Cloudflare `_headers` parsing. Shared by the middleware and scripts/verify-deploy.ts. */

/** Parses `_headers`: an unindented path line followed by indented `Name: value` lines. */
export function parseHeadersFile(text: string): Map<string, Map<string, string>> {
  const rules = new Map<string, Map<string, string>>();
  let current: Map<string, string> | undefined;
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#') || trimmed.startsWith('!')) continue;
    if (!/^\s/.test(line)) {
      current = new Map();
      rules.set(trimmed, current);
      continue;
    }
    const colon = trimmed.indexOf(':');
    if (current && colon > 0) {
      current.set(trimmed.slice(0, colon).trim().toLowerCase(), trimmed.slice(colon + 1).trim());
    }
  }
  return rules;
}

/** Sets every header the response does not already carry. */
export function applyHeaders(response: Response, headers: Map<string, string>): Response {
  for (const [name, value] of headers) {
    if (!response.headers.has(name)) response.headers.set(name, value);
  }
  return response;
}
