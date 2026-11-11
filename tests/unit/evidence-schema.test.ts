import { describe, expect, it } from 'vitest';
import { caseSchema, evidenceSchema, testimonialSchema } from '../../src/content/schemas';

const validCase = {
  title: 'Inventory architecture redesign',
  summary:
    'Split inventory logic into services with clear contracts and reduced coupling between modules.',
  translationKey: 'sea-inventory',
  role: 'Architect and lead developer',
  period: { start: '2025-11-01', end: '2025-12-11' },
  competencies: ['architecture', 'ux'],
  stack: ['TypeScript', 'Next.js', 'Express', 'Prisma'],
  confidentiality: 'public',
  evidence: [{ kind: 'repo', label: 'SEA repository', url: 'https://github.com/example/sea' }],
  lessons: 'I would have defined the API contracts before building the UI to avoid rework.',
};

describe('caseSchema: results, not promises', () => {
  it('accepts a case with verifiable evidence', () => {
    expect(caseSchema.safeParse(validCase).success).toBe(true);
  });

  it('rejects a case without evidence', () => {
    const result = caseSchema.safeParse({ ...validCase, evidence: [] });
    expect(result.success).toBe(false);
    expect(JSON.stringify(result.error?.issues)).toContain('Results, not promises');
  });

  it('requires an anonymization note on anonymized cases', () => {
    const result = caseSchema.safeParse({ ...validCase, confidentiality: 'anonymized' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['anonymizationNote']);
  });

  it('rejects a period that ends before it starts', () => {
    const result = caseSchema.safeParse({
      ...validCase,
      period: { start: '2025-12-01', end: '2025-11-01' },
    });
    expect(result.success).toBe(false);
  });

  it('requires substantive lessons', () => {
    expect(caseSchema.safeParse({ ...validCase, lessons: 'None.' }).success).toBe(false);
  });
});

describe('evidenceSchema', () => {
  it('rejects a metric without a reproducible method', () => {
    const result = evidenceSchema.safeParse({ kind: 'metric', label: 'p95 from 1.8 s to 420 ms' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.path).toEqual(['method']);
  });

  it('accepts a metric with a method', () => {
    const result = evidenceSchema.safeParse({
      kind: 'metric',
      label: 'p95 from 1.8 s to 420 ms',
      method: 'k6 script in scripts/bench.js, 30 runs',
    });
    expect(result.success).toBe(true);
  });

  it('requires a URL for demos, repos, videos and artifacts', () => {
    for (const kind of ['demo', 'repo', 'video', 'artifact'] as const) {
      expect(evidenceSchema.safeParse({ kind, label: 'No link' }).success).toBe(false);
    }
  });

  it('requires the testimonial id', () => {
    expect(evidenceSchema.safeParse({ kind: 'testimonial', label: 'Testimonial' }).success).toBe(
      false,
    );
  });
});

describe('testimonialSchema', () => {
  const validTestimonial = {
    quote: 'Samuel untangled a project that had been stuck for months and shipped it on time.',
    author: {
      name: 'First Last',
      role: 'Tech lead',
      company: 'Company',
      relationship: 'Was my tech lead in 2025',
    },
    date: '2026-10-01',
    competencies: ['lifecycle'],
    originalLocale: 'es',
    translationKey: 'sample-testimonial',
    consent: { date: '2026-10-02', channel: 'email' },
  };

  it('accepts a testimonial with consent', () => {
    expect(testimonialSchema.safeParse(validTestimonial).success).toBe(true);
  });

  it('rejects a testimonial without consent', () => {
    const { consent: _omitted, ...withoutConsent } = validTestimonial;
    expect(testimonialSchema.safeParse(withoutConsent).success).toBe(false);
  });
});
