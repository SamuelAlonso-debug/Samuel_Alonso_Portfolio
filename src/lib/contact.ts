/** Contact form: input schema and Turnstile check. Error messages are codes; the page localizes them. */
import { z } from 'astro/zod';

export const topics = ['review', 'project', 'support', 'other'] as const;

export const contactInput = z.object({
  name: z.string().trim().min(2, 'name').max(100, 'name'),
  email: z.email('email').max(254, 'email'),
  company: z.string().trim().max(100, 'company').optional(),
  topic: z.enum(topics, 'topic'),
  message: z.string().trim().min(20, 'message').max(4000, 'message'),
  // Honeypot: hidden from people, bots fill it in.
  website: z.string().max(0, 'honeypot').optional(),
  'cf-turnstile-response': z.string().min(1, 'turnstile').max(2048, 'turnstile'),
});

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
