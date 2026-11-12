/** Contact form: input schema and Turnstile check. Error messages are codes; the page localizes them. */
import type { AstroGlobal } from 'astro';
import { z } from 'astro/zod';

export const topics = ['review', 'project', 'support', 'other'] as const;

// One-line fields reach the email subject: no control or invisible format characters (CRLF injection).
const ONE_LINE = /^[^\p{Cc}\p{Cf}]*$/u;
// The message keeps line breaks and tabs, nothing else from those classes.
const MULTI_LINE = /^(?:[^\p{Cc}\p{Cf}]|[\t\n\r])*$/u;

export const contactInput = z.object({
  name: z.string().trim().min(2, 'name').max(100, 'name').regex(ONE_LINE, 'name'),
  email: z.email('email').max(254, 'email'),
  company: z.string().trim().max(100, 'company').regex(ONE_LINE, 'company').optional(),
  topic: z.enum(topics, 'topic'),
  message: z.string().trim().min(20, 'message').max(4000, 'message').regex(MULTI_LINE, 'message'),
  // Honeypot: hidden from people, bots fill it in.
  website: z.string().max(0, 'honeypot').optional(),
  'cf-turnstile-response': z
    .string()
    .min(1, 'turnstile')
    .max(2048, 'turnstile')
    .regex(/^[\w.-]*$/, 'turnstile'),
});

/** Largest request body an Action accepts: the form at its limits fits well under it. */
export const MAX_ACTION_BYTES = 16_384;

/**
 * Gate for `/_actions/*`, before Astro parses the body: same-origin browser POSTs of a bounded
 * size only. Returns the rejection, or undefined to let the request through.
 */
export function guardAction(request: Request): Response | undefined {
  if (request.method !== 'POST')
    return new Response(null, { status: 405, headers: { allow: 'POST' } });
  const origin = request.headers.get('origin');
  const site = request.headers.get('sec-fetch-site');
  if (origin !== new URL(request.url).origin || (site !== null && site !== 'same-origin')) {
    return new Response(null, { status: 403 });
  }
  const length = Number(request.headers.get('content-length'));
  if (!Number.isInteger(length) || length <= 0) return new Response(null, { status: 411 });
  if (length > MAX_ACTION_BYTES) return new Response(null, { status: 413 });
  return undefined;
}

export type ContactInput = z.infer<typeof contactInput>;

/** True when Cloudflare confirms the Turnstile token. */
export async function verifyTurnstile(token: string, secret: string, ip: string | null) {
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
  });
  if (!res.ok) return false;
  const data: { success?: boolean } = await res.json();
  return data.success === true;
}

export const turnstileOrigin = 'https://challenges.cloudflare.com';

/** Allows Turnstile in the page CSP. Call it in the view frontmatter: a nested component runs after the head is sent. */
export function allowTurnstile(csp: AstroGlobal['csp']) {
  csp?.insertScriptResource(turnstileOrigin);
  csp?.insertDirective(`frame-src ${turnstileOrigin}`);
}
