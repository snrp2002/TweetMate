import { env } from '../config/env.js';

/**
 * Transactional email through Resend's HTTP API.
 *
 * Deliberately no SDK: it is one POST, and the dependency would only wrap
 * fetch. Optional in the same way storage is — with no API key configured the
 * app still runs, and the routes that need mail say so plainly rather than
 * failing in a confusing way.
 */

const ENDPOINT = 'https://api.resend.com/emails';

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
      Authorization: `Bearer ${env.mail.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: env.mail.from, to: [to], subject, text, html }),
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
