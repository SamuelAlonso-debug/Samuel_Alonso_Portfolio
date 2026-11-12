/** Published cases from the collection. Pairing runs on every build that reads them. */
import { getCollection, type CollectionEntry } from 'astro:content';
import type { Locale } from '../i18n/config';
import { routes, type Paths } from '../i18n/routes';
import { byFeaturedThenRecent, localeOf, pairCases, slugOf } from './cases';

export type CasePair = Record<Locale, CollectionEntry<'cases'>>;

/** A locale's published cases and their ES ↔ EN pairs, featured first. */
export async function getCases(locale: Locale) {
  const all = await getCollection('cases', ({ data }) => !data.draft);
  const pairs = pairCases(all).sort((a, b) => byFeaturedThenRecent(a[locale], b[locale]));
  return { cases: pairs.map((pair) => pair[locale]), pairs };
}

/** Page path of a case in its own locale. */
export function caseHref(entry: CollectionEntry<'cases'>): string {
  return `${routes.cases[localeOf(entry.id)]}${slugOf(entry.id)}/`;
}

export function casePaths(pair: CasePair): Paths {
  return { es: caseHref(pair.es), en: caseHref(pair.en) };
}

/** List page plus one page per case. No cases: no pages, so nothing links to an empty list. */
export async function caseRoutes(locale: Locale) {
  const { pairs } = await getCases(locale);
  if (pairs.length === 0) return [];
  return [
    { params: { slug: undefined }, props: { pairs, at: undefined } },
    ...pairs.map((pair, at) => ({
      params: { slug: slugOf(pair[locale].id) },
      props: { pairs, at },
    })),
  ];
}
