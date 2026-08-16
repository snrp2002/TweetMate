import { env } from '../config/env.js';

/**
 * Transactional email through Brevo's HTTP API.
 *
 * Brevo rather than Resend because it verifies a single sender address by
 * emailed link, with no domain and no DNS records. Resend's shared test domain
 * refuses any recipient except the account owner, which would have made
 * password reset work for exactly one person.
 *
 * Deliberately no SDK: this is one POST, and the dependency would only wrap
 * fetch. Optional in the same way storage is — with no API key configured the
 * app still runs, and the routes that need mail say so plainly.
 */

const ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

export function isMailConfigured(): boolean {
  return Boolean(env.mail.apiKey && env.mail.from);
}

interface Mail {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendMail({ to, subject, text, html }: Mail): Promise<void> {
  if (!isMailConfigured()) throw new Error('Email is not configured on this server.');

  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      // Brevo uses its own header, not Authorization: Bearer.
      'api-key': env.mail.apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { name: env.mail.fromName, email: env.mail.from },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Email failed (${response.status}): ${detail.slice(0, 200)}`);
  }
}

/** Plain text alongside HTML, so the mail survives a text-only client. */
export function resetEmail(name: string, link: string, minutes: number) {
  const text = [
    `Hi ${name},`,
    '',
    'Someone asked to reset your TweetMate password. Open this link to choose a new one:',
    link,
    '',
    `The link stops working in ${minutes} minutes and can only be used once.`,
    'If this was not you, ignore this email — nothing has changed.',
  ].join('\n');

  const html = `
    <div style="font-family:ui-sans-serif,system-ui,sans-serif;line-height:1.6;color:#1a1a1a;max-width:520px">
      <p>Hi ${escapeHtml(name)},</p>
      <p>Someone asked to reset your TweetMate password. Choose a new one here:</p>
      <p>
        <a href="${escapeHtml(link)}"
           style="display:inline-block;background:#e0a458;color:#100d08;padding:11px 20px;
                  border-radius:8px;text-decoration:none;font-weight:600">
          Reset password
        </a>
      </p>
      <p style="color:#666;font-size:13px">
        Or paste this into your browser:<br />
        <span style="word-break:break-all">${escapeHtml(link)}</span>
      </p>
      <p style="color:#666;font-size:14px">
        The link stops working in ${minutes} minutes and can only be used once.<br />
        If this was not you, ignore this email — nothing has changed.
      </p>
    </div>
  `.trim();

  return { subject: 'Reset your TweetMate password', text, html };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
