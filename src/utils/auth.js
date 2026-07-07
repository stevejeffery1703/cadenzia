// Auth client (browser). Thin wrapper around the Worker's /api/auth endpoints
// (passwordless magic-link). All privileged data access happens server-side.

import { api, setToken } from './api';

export async function signInWithEmail(email) {
  // Sends a magic link via the Worker (which talks to D1 + Resend).
  return api('/auth/magic-link', { method: 'POST', body: { email } });
}

export async function exchangeToken(otp, email) {
  // A pending referral tag (captured from ?ref= on first visit) rides along with
  // the sign-in, so a new account's free week is doubled and credited to whoever
  // invited them.
  const ref = localStorage.getItem('cad_ref') || undefined;
  const data = await api('/auth/verify', { method: 'POST', body: { otp, email, ref } });
  if (data && data.token) {
    setToken(data.token);
    localStorage.removeItem('cad_ref'); // consumed, or irrelevant to a returning user
    // A brand-new account's welcome ({ days, referred }) — the player shows it once.
    if (data.welcome) localStorage.setItem('cad_welcome', JSON.stringify(data.welcome));
  }
  return data;
}

export async function getMe() {
  return api('/auth/me', { auth: true });
}

export function signOut() {
  setToken(null);
}
