import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { applyHeaders, parseHeadersFile } from '../../src/lib/headers';

const rules = parseHeadersFile(readFileSync('public/_headers', 'utf8'));
const page = rules.get('/*') ?? new Map<string, string>();

describe('worker headers', () => {
  it('maps every /* header from public/_headers onto a response', () => {
    const response = applyHeaders(new Response('{}'), page);
    expect(page.size).toBeGreaterThan(5);
    for (const [name, value] of page) expect(response.headers.get(name)).toBe(value);
  });
});
