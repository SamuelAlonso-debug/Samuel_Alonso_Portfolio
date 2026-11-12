/** Published cases from the collection. Pairing runs on every build that reads them. */
import { getCollection } from 'astro:content';
import type { Locale } from '../i18n/config';
import { byFeaturedThenRecent, pairCases } from './cases';

/** A locale's published cases, featured first, and every ES ↔ EN pair. */
export async function getCases(locale: Locale) {
  const all = await getCollection('cases', ({ data }) => !data.draft);
  const pairs = pairCases(all);
  const cases = pairs.map((pair) => pair[locale]).sort(byFeaturedThenRecent);
  return { cases, pairs };
}
