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

// Shared helper used by auth + future announcement sends.
export async function sendEmail(env, { to, subject, text, html }) {
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
      text: text ? `${text}\n\nUnsubscribe: ${unsubscribe}` : undefined,
      html: html ? `${html}<p><a href="${unsubscribe}">Unsubscribe</a></p>` : undefined,
    }),
  });
  if (!res.ok) throw new Error(`Resend failed (${res.status})`);
  return res.json();
}
