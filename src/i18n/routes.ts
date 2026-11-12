import type { Locale } from './config';

/** One page's path in each locale. */
export type Paths = Record<Locale, string>;

/**
 * Localized route map. Each page exists in both locales with its own slug.
 * Register only routes that exist, so the language switch never links to a 404.
 */
export const routes = {
  home: { es: '/', en: '/en/' },
  cases: { es: '/casos/', en: '/en/work/' },
  howItsMade: { es: '/como-esta-hecho/', en: '/en/how-its-made/' },
} as const satisfies Record<string, Paths>;
