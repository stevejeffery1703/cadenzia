// Stripe helpers (browser side). We never collect card details ourselves —
// the Worker creates a Checkout Session and we redirect to Stripe's hosted page.

import { api } from './api';

// Kicks off subscription checkout. Returns nothing — redirects the browser.
export async function startCheckout() {
  const { url } = await api('/subscription/checkout', { method: 'POST', auth: true });
  if (url) window.location.href = url;
}

// Opens the Stripe customer portal (manage / cancel subscription).
export async function openBillingPortal() {
  const { url } = await api('/subscription/portal', { method: 'POST', auth: true });
  if (url) window.location.href = url;
}
