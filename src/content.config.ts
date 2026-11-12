import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { caseBaseSchema, checkCaseRules, testimonialSchema } from './content/schemas';

const cases = defineCollection({
  // CASES_DIR=tests/fixtures/cases builds the track with test cases; production never sets it.
  loader: glob({
    pattern: '**/*.{md,mdx}',
    base: process.env['CASES_DIR'] ?? './src/content/cases',
  }),
  schema: ({ image }) =>
    caseBaseSchema.extend({ cover: image().optional() }).superRefine(checkCaseRules),
});

const testimonials = defineCollection({
  // TESTIMONIALS_DIR=tests/fixtures/testimonials renders the scene with test quotes; production never sets it.
  loader: glob({
    pattern: '**/*.md',
    base: process.env['TESTIMONIALS_DIR'] ?? './src/content/testimonials',
  }),
  schema: testimonialSchema,
});

export const collections = { cases, testimonials };
