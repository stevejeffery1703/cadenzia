// Supabase client (browser). Uses the public anon key only — all privileged
// operations go through the Worker with the service-role key.
//
// NOTE: @supabase/supabase-js is intentionally NOT a hard dependency yet to keep
// the MVP lean. This module exposes a thin auth surface backed by the Worker's
// /api/auth endpoints (magic-link / email+password). Swap to supabase-js if you
// prefer the official client.

import { api, setToken } from './api';

export async function signInWithEmail(email) {
  // Sends a magic link via the Worker (which talks to Supabase + Resend).
  return api('/auth/magic-link', { method: 'POST', body: { email } });
}

export async function exchangeToken(otp, email) {
  const data = await api('/auth/verify', { method: 'POST', body: { otp, email } });
  if (data && data.token) setToken(data.token);
  return data;
}

export async function getMe() {
  return api('/auth/me', { auth: true });
}

export function signOut() {
  setToken(null);
}
