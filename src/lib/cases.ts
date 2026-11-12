/** Case pairing and order. Pure (no astro:content), so Vitest can test it. */
import { locales, type Locale } from '../i18n/config';

interface CaseLike {
  id: string;
  data: { translationKey: string; featured: boolean; period: { start: Date } };
}

/** Locale folder of an entry id: `es/my-case` → `es`. */
export function localeOf(id: string): Locale {
  const locale = locales.find((l) => id.startsWith(`${l}/`));
  if (!locale) throw new Error(`Entry "${id}" must live in es/ or en/.`);
  return locale;
}

/** ES ↔ EN pairs by translationKey. A case without its translation fails the build. */
export function pairCases<T extends CaseLike>(entries: T[]): Record<Locale, T>[] {
  const pairs = new Map<string, Partial<Record<Locale, T>>>();
  for (const entry of entries) {
    const key = entry.data.translationKey;
    const locale = localeOf(entry.id);
    const pair = pairs.get(key) ?? {};
    const taken = pair[locale];
    if (taken) throw new Error(`Cases "${taken.id}" and "${entry.id}" share "${key}".`);
    pairs.set(key, { ...pair, [locale]: entry });
  }
  return [...pairs].map(([key, { es, en }]) => {
    if (!es || !en) throw new Error(`Case "${key}" needs an es/ and an en/ file.`);
    return { es, en };
  });
}

/** Featured first, then the most recent. */
export function byFeaturedThenRecent(a: CaseLike, b: CaseLike): number {
  return (
    Number(b.data.featured) - Number(a.data.featured) ||
    b.data.period.start.getTime() - a.data.period.start.getTime()
  );
}
