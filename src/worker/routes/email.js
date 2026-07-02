// Email capture + transactional sending via Resend.
//   POST /api/email/subscribe   → opt-in to new-track announcements (consent required)
//   GET  /api/email/unsubscribe → one-click unsubscribe link target
//
// We only ever email about new music. Every email carries an unsubscribe link.

import { json } from '../middleware/cors.js';
import { selectOne, insertRow, updateRows } from '../lib/db.js';

export async function subscribe(request, env) {
  const { email, consent } = await request.json();
  if (!email || !consent) {
    return json({ error: 'Email and consent required' }, { status: 400, env });
  }

  const normalizedEmail = email.toLowerCase();
  const existing = await selectOne(env, 'email_subscribers', { email: normalizedEmail }, ['id']);
  if (existing) {
    await updateRows(env, 'email_subscribers', { id: existing.id }, {
      consent_given: true,
      unsubscribed: false,
    });
  } else {
    await insertRow(env, 'email_subscribers', {
      email: normalizedEmail,
      consent_given: true,
      unsubscribed: false,
    });
  }

  return json({ ok: true }, { env });
}

export async function unsubscribe(request, env) {
  const url = new URL(request.url);
  const email = url.searchParams.get('email');
  if (!email) return new Response('Missing email', { status: 400 });

  await updateRows(env, 'email_subscribers', { email: email.toLowerCase() }, {
    unsubscribed: true,
  });

  return new Response(
    'You have been unsubscribed. You will not receive further emails. Thank you.',
    { status: 200, headers: { 'Content-Type': 'text/plain' } }
  );
}

// Shared helper used by auth + announcement sends. Only marketing sends (new-
// music announcements) carry an unsubscribe footer — transactional mail (sign-in
// codes) isn't part of that list and shouldn't imply it is.
export async function sendEmail(env, { to, subject, text, html, marketing = false }) {
  if (!env.RESEND_API_KEY) {
    // In dev without a key, no-op so flows don't crash. Log for visibility.
    console.log(`[email:dev] to=${to} subject="${subject}"\n${text || ''}`);
    return { dev: true };
  }
  const unsubscribe = `${env.APP_URL}/api/email/unsubscribe?email=${encodeURIComponent(to)}`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Cadenzia <hello@cadenzia.app>',
      to,
      subject,
      text: marketing && text ? `${text}\n\nUnsubscribe: ${unsubscribe}` : text,
      html: marketing && html ? `${html}<p><a href="${unsubscribe}">Unsubscribe</a></p>` : html,
    }),
  });
  if (!res.ok) throw new Error(`Resend failed (${res.status})`);
  return res.json();
}

// Shared shell for transactional emails — warm paper background, serif
// wordmark, plain content. Kept to web-safe fonts since client CSS support for
// @font-face in email is unreliable.
export function emailShell(bodyHtml) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:32px 16px;background:#F5F1E8;font-family:-apple-system,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" style="max-width:420px;margin:0 auto;background:#FCFAF4;border-radius:16px;padding:40px 32px;">
      <tr>
        <td style="text-align:center;font-family:Georgia,'Times New Roman',serif;font-size:24px;color:#232019;padding-bottom:28px;">
          Cadenzia
        </td>
      </tr>
      ${bodyHtml}
    </table>
  </body>
</html>`;
}
