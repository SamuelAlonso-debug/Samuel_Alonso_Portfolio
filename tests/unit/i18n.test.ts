import { describe, expect, it } from 'vitest';
import { locales } from '../../src/i18n/config';
import { routes } from '../../src/i18n/routes';
import { ui } from '../../src/i18n/ui';

describe('ES/EN parity', () => {
  it('both dictionaries have exactly the same keys', () => {
    expect(Object.keys(ui.en).sort()).toEqual(Object.keys(ui.es).sort());
  });

  it('no translation is empty', () => {
    for (const locale of locales) {
      for (const [key, value] of Object.entries(ui[locale])) {
        expect(value.trim(), `${locale}:${key}`).not.toBe('');
      }
    }
  });

  it('every route exists in both locales and EN lives under /en/', () => {
    for (const [key, paths] of Object.entries(routes)) {
      expect(paths.es, key).toMatch(/^\//);
      expect(paths.en, key).toMatch(/^\/en\//);
    }
  });

  it('slugs are unique across routes', () => {
    const all = Object.values(routes).flatMap((paths) => [paths.es, paths.en]);
    expect(new Set(all).size).toBe(all.length);
  });
});
