/**
 * Owner notification. The provider lives only here, so changing it stays local.
 * Resend free tier without a verified domain: sender onboarding@resend.dev, recipient = the account's
 * own address. No auto-reply to the sender, so the form cannot email third parties.
 */
export interface Mail {
  subject: string;
  text: string;
  replyTo: string;
}

export interface MailEnv {
  RESEND_API_KEY?: string;
  CONTACT_TO?: string;
  /** `log` prints instead of sending. Local and E2E only; never set in production. */
  EMAIL_SINK?: string;
}

export async function sendEmail(env: MailEnv, mail: Mail) {
  if (env.EMAIL_SINK === 'log') {
    console.log(`[email] ${mail.subject}`);
    return;
  }
  if (!env.RESEND_API_KEY || !env.CONTACT_TO) throw new Error('Email is not configured.');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Portfolio <onboarding@resend.dev>',
      to: [env.CONTACT_TO],
      reply_to: mail.replyTo,
      subject: mail.subject,
      text: mail.text,
    }),
  });
  if (!res.ok) throw new Error(`Resend responded ${res.status}.`);
}
