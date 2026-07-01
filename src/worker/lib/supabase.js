// Thin Supabase REST helper for the Worker. Uses the service-role key, so this
// MUST only ever run server-side. RLS still applies as defence in depth, but the
// Worker is the trusted boundary for privileged writes.

function base(env) {
  return `${env.SUPABASE_URL}/rest/v1`;
}

function headers(env, extra = {}) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  };
}

// Select rows. `query` is a PostgREST query string, e.g. "id=eq.123&select=*".
export async function select(env, table, query) {
  const res = await fetch(`${base(env)}/${table}?${query}`, { headers: headers(env) });
  if (!res.ok) throw new Error(`Supabase select failed (${res.status})`);
  return res.json();
}

export async function insert(env, table, row) {
  const res = await fetch(`${base(env)}/${table}`, {
    method: 'POST',
    headers: headers(env, { Prefer: 'return=representation' }),
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(`Supabase insert failed (${res.status})`);
  return res.json();
}

export async function update(env, table, query, patch) {
  const res = await fetch(`${base(env)}/${table}?${query}`, {
    method: 'PATCH',
    headers: headers(env, { Prefer: 'return=representation' }),
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`Supabase update failed (${res.status})`);
  return res.json();
}

export async function remove(env, table, query) {
  const res = await fetch(`${base(env)}/${table}?${query}`, {
    method: 'DELETE',
    headers: headers(env),
  });
  if (!res.ok) throw new Error(`Supabase delete failed (${res.status})`);
  return true;
}

// Call a Postgres function (PostgREST RPC). Used for atomic operations such as
// incrementing the global play counter.
export async function rpc(env, fn, args = {}) {
  const res = await fetch(`${base(env)}/rpc/${fn}`, {
    method: 'POST',
    headers: headers(env),
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`Supabase rpc ${fn} failed (${res.status})`);
  return res.json();
}
