export const locales = ['es', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'es';

/** `lang` and `hreflang` value per locale. */
export const htmlLang: Record<Locale, string> = { es: 'es-MX', en: 'en' };

/** `og:locale` value per locale. */
export const ogLocale: Record<Locale, string> = { es: 'es_MX', en: 'en_US' };

export function otherLocale(locale: Locale): Locale {
  return locale === 'es' ? 'en' : 'es';
}
