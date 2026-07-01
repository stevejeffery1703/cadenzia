// Tiny fetch wrapper for the Worker API. All endpoints live under /api.
// Auth token (Supabase session JWT) is attached when present.

const TOKEN_KEY = 'cad_token';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || null;
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(`/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data;
}

// A stable anonymous device id so free-tier limits and share tokens can be
// tracked in KV without requiring an account. Stored locally only.
export function deviceId() {
  let id = localStorage.getItem('cad_device');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('cad_device', id);
  }
  return id;
}
