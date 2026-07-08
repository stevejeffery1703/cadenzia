// Tiny fetch wrapper for the Worker API. All endpoints live under /api.
// Auth token (session JWT) is attached when present.

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
    const err = new Error((data && data.error) || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// A stable anonymous device id, stored locally only. Currently just tags the
// play-count ping; the free-tier daily limit lives in localStorage, not here.
export function deviceId() {
  let id = localStorage.getItem('cad_device');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('cad_device', id);
  }
  return id;
}
