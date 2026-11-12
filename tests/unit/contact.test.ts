import { describe, expect, it } from 'vitest';
import { contactInput, guardAction, MAX_ACTION_BYTES } from '../../src/lib/contact';

const valid = {
  name: 'Ana López',
  email: 'ana@example.com',
  topic: 'project',
  message: 'We need a new inventory system for two stores.',
  'cf-turnstile-response': 'token',
};

const codes = (input: object) =>
  contactInput.safeParse(input).error?.issues.map((issue) => issue.message) ?? [];

describe('contactInput', () => {
  it('accepts a complete submission', () => {
    expect(codes(valid)).toEqual([]);
  });

  it('rejects each invalid field with its code', () => {
    expect(codes({ ...valid, name: ' ' })).toEqual(['name']);
    expect(codes({ ...valid, email: 'ana@' })).toEqual(['email']);
    expect(codes({ ...valid, topic: 'jobs' })).toEqual(['topic']);
    expect(codes({ ...valid, message: 'Hi' })).toEqual(['message']);
    expect(codes({ ...valid, 'cf-turnstile-response': '' })).toEqual(['turnstile']);
  });

  it('rejects a filled honeypot', () => {
    expect(codes({ ...valid, website: 'https://spam.example' })).toEqual(['honeypot']);
  });
});

describe('injection', () => {
  it('rejects control characters in one-line fields, keeps line breaks in the message', () => {
    expect(codes({ ...valid, name: 'Ana\r\nBcc: x@evil.test' })).toEqual(['name']);
    expect(codes({ ...valid, company: 'Acme\u0000' })).toEqual(['company']);
    expect(codes({ ...valid, message: `${valid.message}\u202e` })).toEqual(['message']);
    expect(codes({ ...valid, message: `${valid.message}\nSecond line.` })).toEqual([]);
    expect(codes({ ...valid, 'cf-turnstile-response': 'a b' })).toEqual(['turnstile']);
  });
});

describe('guardAction', () => {
  const url = 'https://site.test/_actions/contact';
  const req = (method: string, headers: Record<string, string>) =>
    new Request(url, { method, headers });
  const ok = { origin: 'https://site.test', 'content-length': '200' };

  it('lets a same-origin POST of a bounded size through', () => {
    expect(guardAction(req('POST', { ...ok, 'sec-fetch-site': 'same-origin' }))).toBeUndefined();
  });

  it('refuses other methods, origins and sizes', () => {
    const status = (method: string, headers: Record<string, string>) =>
      guardAction(req(method, headers))?.status;
    expect(status('GET', ok)).toBe(405);
    expect(status('POST', { ...ok, origin: 'https://evil.test' })).toBe(403);
    expect(status('POST', { 'content-length': '200' })).toBe(403);
    expect(status('POST', { ...ok, 'sec-fetch-site': 'cross-site' })).toBe(403);
    expect(status('POST', { origin: ok.origin })).toBe(411);
    expect(status('POST', { ...ok, 'content-length': String(MAX_ACTION_BYTES + 1) })).toBe(413);
  });
});
