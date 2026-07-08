// Email capture + transactional sending via Resend.
//   POST /api/email/subscribe   → opt-in to new-track announcements (consent required)
//   GET  /api/email/unsubscribe → one-click unsubscribe link target
//
// We only ever email about new music. Every marketing email carries an
// unsubscribe link and our physical postal address (CAN-SPAM).

import { json } from '../middleware/cors.js';
import { selectOne, insertRow, updateRows } from '../lib/db.js';
import { sign, verify } from '../lib/jwt.js';

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

// One-click unsubscribe. The link carries a signed token, not a raw email, so
// nobody can unsubscribe an address they don't control by guessing it. The same
// handler serves the human GET (clicking the footer link) and the RFC 8058
// one-click POST that Gmail/Yahoo fire from the List-Unsubscribe header.
async function applyUnsubscribe(request, env) {
  const token = new URL(request.url).searchParams.get('token');
  const claims = token ? await verify(token, env.JWT_SECRET) : null;
  if (!claims || claims.kind !== 'unsubscribe' || !claims.email) {
    return new Response('This unsubscribe link is invalid or has expired.', {
      status: 400,
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  await updateRows(env, 'email_subscribers', { email: claims.email.toLowerCase() }, {
    unsubscribed: true,
  });

  return new Response(
    'You have been unsubscribed. You will not receive further emails. Thank you.',
    { status: 200, headers: { 'Content-Type': 'text/plain' } }
  );
}

export const unsubscribe = applyUnsubscribe; // GET — footer link
export const unsubscribePost = applyUnsubscribe; // POST — one-click (RFC 8058)

// Shared helper used by auth + announcement sends. Only marketing sends (new-
// music announcements) carry an unsubscribe footer — transactional mail (sign-in
// codes) isn't part of that list and shouldn't imply it is.
export async function sendEmail(env, { to, subject, text, html, marketing = false }) {
  if (!env.RESEND_API_KEY) {
    // In dev without a key, no-op so flows don't crash. Log for visibility.
    console.log(`[email:dev] to=${to} subject="${subject}"\n${text || ''}`);
    return { dev: true };
  }
  // CAN-SPAM: every marketing message needs a valid physical postal address and a
  // working unsubscribe. Refuse to send marketing mail without the address rather
  // than ever send a non-compliant blast. Set MAILING_ADDRESS as a Worker var.
  if (marketing && !env.MAILING_ADDRESS) {
    throw new Error('MAILING_ADDRESS must be set before sending marketing email (CAN-SPAM).');
  }
  // Only marketing mail carries an unsubscribe link, and it points at a signed
  // token (see applyUnsubscribe) with a long life so an old newsletter's link
  // still works. Transactional mail (sign-in codes) needs none of this.
  let unsubscribe = null;
  if (marketing) {
    const token = await sign({ email: to, kind: 'unsubscribe' }, env.JWT_SECRET, {
      expiresInSeconds: 60 * 60 * 24 * 365 * 5,
    });
    unsubscribe = `${env.APP_URL}/api/email/unsubscribe?token=${token}`;
  }
  const footerText = unsubscribe ? `\n\n${env.MAILING_ADDRESS}\nUnsubscribe: ${unsubscribe}` : '';
  const footerHtml = unsubscribe
    ? `<p style="margin-top:24px;color:#6B6358;font-size:12px;line-height:1.5">${env.MAILING_ADDRESS}<br><a href="${unsubscribe}" style="color:#6B6358">Unsubscribe</a></p>`
    : '';
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
      text: marketing && text ? `${text}${footerText}` : text,
      html: marketing && html ? `${html}${footerHtml}` : html,
      // One-click unsubscribe (RFC 8058) for marketing mail — now effectively
      // required by Gmail/Yahoo for bulk senders; the header URL is the same
      // signed token, and the POST is handled by unsubscribePost.
      ...(marketing && unsubscribe
        ? {
            headers: {
              'List-Unsubscribe': `<${unsubscribe}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            },
          }
        : {}),
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
