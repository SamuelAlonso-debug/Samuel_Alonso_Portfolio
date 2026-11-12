import { describe, expect, it } from 'vitest';
import { contactInput } from '../../src/lib/contact';

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
