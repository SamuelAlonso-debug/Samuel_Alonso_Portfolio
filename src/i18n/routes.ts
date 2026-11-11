import type { Locale } from './config';

/**
 * Localized route map. Each page exists in both locales with its own slug.
 * Register only routes that exist, so the language switch never links to a 404.
 */
export const routes = {
  home: { es: '/', en: '/en/' },
} as const satisfies Record<string, Record<Locale, string>>;

export type RouteKey = keyof typeof routes;

export function pathFor(key: RouteKey, locale: Locale): string {
  return routes[key][locale];
}
