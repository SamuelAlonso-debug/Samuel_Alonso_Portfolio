/**
 * Content schemas without Astro runtime deps, so Vitest can test them.
 * Core rule "results, not promises": no case ships without verifiable evidence.
 */
import { z } from 'astro/zod';

export const competencies = ['architecture', 'ux', 'lifecycle', 'incidents', 'resources'] as const;

export const evidenceKinds = [
  'demo',
  'repo',
  'video',
  'testimonial',
  'artifact',
  'metric',
] as const;

/** Kinds the visitor verifies by following a link. */
const linkedKinds = new Set<string>(['demo', 'repo', 'video', 'artifact']);

export const evidenceSchema = z
  .object({
    kind: z.enum(evidenceKinds),
    label: z.string().min(3),
    url: z.url().optional(),
    /** Id of an entry in the `testimonials` collection. */
    testimonial: z.string().optional(),
    /** How to reproduce a number (script, notebook, report). Required for `metric`. */
    method: z.string().min(10).optional(),
  })
  .superRefine((evidence, ctx) => {
    if (linkedKinds.has(evidence.kind) && !evidence.url) {
      ctx.addIssue({
        code: 'custom',
        path: ['url'],
        message: `Evidence of kind "${evidence.kind}" needs a verifiable URL.`,
      });
    }
    if (evidence.kind === 'testimonial' && !evidence.testimonial) {
      ctx.addIssue({
        code: 'custom',
        path: ['testimonial'],
        message: 'Evidence of kind "testimonial" needs the testimonial id.',
      });
    }
    if (evidence.kind === 'metric' && !evidence.method) {
      ctx.addIssue({
        code: 'custom',
        path: ['method'],
        message: 'A metric needs a reproducible method (script, notebook or report).',
      });
    }
  });

export const caseBaseSchema = z.object({
  title: z.string().min(10).max(90),
  summary: z.string().min(40).max(220),
  /** Links the ES and EN versions of the same case. */
  translationKey: z.string().regex(/^[a-z0-9-]+$/),
  role: z.string().min(3),
  team: z.string().optional(),
  period: z.object({
    start: z.coerce.date(),
    end: z.coerce.date().optional(),
  }),
  competencies: z.array(z.enum(competencies)).min(1),
  stack: z.array(z.string().min(1)).min(1),
  confidentiality: z.enum(['public', 'anonymized']),
  anonymizationNote: z.string().min(10).optional(),
  evidence: z
    .array(evidenceSchema)
    .min(1, 'Results, not promises: every case needs at least one piece of verifiable evidence.'),
  /** "What I would do differently": honesty is evidence too. */
  lessons: z.string().min(40),
  featured: z.boolean().default(false),
  draft: z.boolean().default(false),
});

type CaseData = z.infer<typeof caseBaseSchema>;

/** Cross-field rules; also applied to Astro's extended schema. */
export function checkCaseRules(data: CaseData, ctx: z.RefinementCtx): void {
  if (data.confidentiality === 'anonymized' && !data.anonymizationNote) {
    ctx.addIssue({
      code: 'custom',
      path: ['anonymizationNote'],
      message: 'An anonymized case must state what was anonymized and under what permission.',
    });
  }
  if (data.period.end && data.period.end < data.period.start) {
    ctx.addIssue({
      code: 'custom',
      path: ['period', 'end'],
      message: 'End date cannot be before start date.',
    });
  }
}

export const caseSchema = caseBaseSchema.superRefine(checkCaseRules);

export const testimonialSchema = z.object({
  quote: z.string().min(20).max(420),
  author: z.object({
    name: z.string().min(3),
    role: z.string().min(2),
    company: z.string().min(2),
    /** Relationship to Samuel, e.g. "Was my tech lead at …". */
    relationship: z.string().min(5),
    linkedin: z.url().optional(),
  }),
  date: z.coerce.date(),
  competencies: z.array(z.enum(competencies)).min(1),
  /** Language it was written in; translations are flagged in the UI. */
  originalLocale: z.enum(['es', 'en']),
  translationKey: z.string().regex(/^[a-z0-9-]+$/),
  /** Written consent to publish name, role and company. */
  consent: z.object({
    date: z.coerce.date(),
    channel: z.string().min(3),
  }),
  /** Placeholder text: the quote shows a visible "sample" mark. */
  demo: z.boolean().default(false),
});
