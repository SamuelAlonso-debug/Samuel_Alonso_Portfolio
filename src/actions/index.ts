import { ActionError, defineAction } from 'astro:actions';
import { contactInput, verifyTurnstile } from '../lib/contact';
import { sendEmail, type MailEnv } from '../lib/email';

interface ContactEnv extends MailEnv {
  TURNSTILE_SECRET_KEY?: string;
  CONTACT_LIMIT?: { limit(options: { key: string }): Promise<{ success: boolean }> };
}

export const server = {
  contact: defineAction({
    accept: 'form',
    input: contactInput,
    handler: async (input, context) => {
      // Imported lazily: a top-level `cloudflare:workers` import breaks the prerender build.
      const env = (await import('cloudflare:workers')).env as ContactEnv;
      const ip = context.request.headers.get('cf-connecting-ip');

      if (!env.TURNSTILE_SECRET_KEY || !env.CONTACT_LIMIT) {
        throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: 'config' });
      }
      const { success } = await env.CONTACT_LIMIT.limit({ key: ip ?? 'unknown' });
      if (!success) throw new ActionError({ code: 'TOO_MANY_REQUESTS', message: 'rate' });
      if (!(await verifyTurnstile(input['cf-turnstile-response'], env.TURNSTILE_SECRET_KEY, ip))) {
        throw new ActionError({ code: 'FORBIDDEN', message: 'turnstile' });
      }

      await sendEmail(env, {
        subject: `Portfolio: ${input.topic} · ${input.name}`,
        replyTo: input.email,
        text: [
          `Name: ${input.name}`,
          `Email: ${input.email}`,
          `Company: ${input.company || '-'}`,
          `Topic: ${input.topic}`,
          '',
          input.message,
        ].join('\n'),
      });
      return { sent: true };
    },
  }),
};
