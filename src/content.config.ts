import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { caseBaseSchema, checkCaseRules, testimonialSchema } from './content/schemas';

const cases = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/cases' }),
  schema: ({ image }) =>
    caseBaseSchema.extend({ cover: image().optional() }).superRefine(checkCaseRules),
});

const testimonials = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/testimonials' }),
  schema: testimonialSchema,
});

export const collections = { cases, testimonials };
