// Minimal CORS helper. Same-origin in production (Worker serves the app), so
// this is mostly for local dev where Vite runs on :5173 and the Worker on :8787.
export function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.APP_URL || '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export function json(data, { status = 200, env } = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...(env ? corsHeaders(env) : {}),
    },
  });
}

export function handlePreflight(env) {
  return new Response(null, { status: 204, headers: corsHeaders(env) });
}
