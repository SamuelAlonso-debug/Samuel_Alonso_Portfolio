import { describe, expect, it } from 'vitest';
import { byFeaturedThenRecent, pairCases } from '../../src/lib/cases';

const entry = (id: string, translationKey: string, start = '2025-01-01', featured = false) => ({
  id,
  data: { translationKey, featured, period: { start: new Date(start) } },
});

describe('case pairing', () => {
  it('pairs ES and EN by translationKey, whatever their slugs', () => {
    const [pair, ...rest] = pairCases([entry('es/tienda', 'shop'), entry('en/shop', 'shop')]);
    expect(rest).toEqual([]);
    expect(pair?.es.id).toBe('es/tienda');
    expect(pair?.en.id).toBe('en/shop');
  });

  it('fails the build when a case misses its translation', () => {
    expect(() => pairCases([entry('es/tienda', 'shop')])).toThrow(
      /"shop" needs an es\/ and an en\//,
    );
  });

  it('fails on two cases with one key in the same locale', () => {
    const twins = [entry('es/a', 'k'), entry('es/b', 'k'), entry('en/a', 'k')];
    expect(() => pairCases(twins)).toThrow(/share "k"/);
  });

  it('fails on a case outside es/ and en/', () => {
    expect(() => pairCases([entry('fr/a', 'k')])).toThrow(/es\/ or en\//);
  });

  it('orders featured first, then the most recent', () => {
    const old = entry('es/old', 'a', '2020-01-01', true);
    const recent = entry('es/new', 'b', '2025-01-01');
    const older = entry('es/older', 'c', '2019-01-01');
    expect([older, recent, old].sort(byFeaturedThenRecent)).toEqual([old, recent, older]);
  });
});
