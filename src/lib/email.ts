import type { Env } from '../types';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
}

/**
 * Stub email sender function.
 * In production, this would integrate with Resend, SendGrid, or Cloudflare Email Workers.
 */
export async function sendEmail(_env: Env, opts: SendEmailOptions): Promise<boolean> {
  console.log(`[Email Stub] Sending email to ${opts.to} with subject "${opts.subject}"`);
  return true;
}
