// Auth client (browser). Thin wrapper around the Worker's /api/auth endpoints
// (passwordless magic-link). All privileged data access happens server-side.

import { api, setToken } from './api';

export async function signInWithEmail(email) {
  // Sends a magic link via the Worker (which talks to D1 + Resend).
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
