// D1 data helpers for the Worker. Every table's primary key is `id` (TEXT),
// generated with crypto.randomUUID() on insert unless already provided.

function whereClause(where) {
  const cols = Object.keys(where);
  return {
    clause: cols.map((c) => `${c} = ?`).join(' AND '),
    values: cols.map((c) => where[c]),
  };
}

export async function selectMany(env, table, where = {}, columns = '*') {
  const cols = Array.isArray(columns) ? columns.join(', ') : columns;
  let sql = `SELECT ${cols} FROM ${table}`;
  const values = [];
  if (Object.keys(where).length) {
    const { clause, values: v } = whereClause(where);
    sql += ` WHERE ${clause}`;
    values.push(...v);
  }
  const { results } = await env.DB.prepare(sql).bind(...values).all();
  return results;
}

export async function selectOne(env, table, where = {}, columns = '*') {
  const rows = await selectMany(env, table, where, columns);
  return rows[0] || null;
}

export async function insertRow(env, table, row) {
  const data = { id: row.id || crypto.randomUUID(), ...row };
  const cols = Object.keys(data);
  const sql = `INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')}) RETURNING *`;
  return env.DB.prepare(sql).bind(...cols.map((c) => data[c])).first();
}

export async function updateRows(env, table, where, patch) {
  const patchCols = Object.keys(patch);
  const { clause, values: whereValues } = whereClause(where);
  const sql = `UPDATE ${table} SET ${patchCols.map((c) => `${c} = ?`).join(', ')} WHERE ${clause} RETURNING *`;
  const { results } = await env.DB.prepare(sql)
    .bind(...patchCols.map((c) => patch[c]), ...whereValues)
    .all();
  return results;
}

export async function deleteRows(env, table, where) {
  const { clause, values } = whereClause(where);
  await env.DB.prepare(`DELETE FROM ${table} WHERE ${clause}`).bind(...values).run();
  return true;
}

// The global play counter is a single fixed row — atomic via RETURNING so
// concurrent plays can't clobber each other (no generic helper needed).
export async function incrementPlays(env) {
  const row = await env.DB.prepare(
    'UPDATE play_counter SET count = count + 1 WHERE id = 1 RETURNING count'
  ).first();
  return row?.count ?? null;
}

export async function getPlayCount(env) {
  const row = await env.DB.prepare('SELECT count FROM play_counter WHERE id = 1').first();
  return row?.count ?? 0;
}

// Subscriber stats panel — hours listened, session count, and the track with
// the most cumulative listening time. Two queries (not a single GROUP BY) so
// "sessions" counts every row, including tracks with no name recorded.
export async function getListeningStats(env, userId) {
  const totals = await env.DB.prepare(
    `SELECT COUNT(*) AS sessions, COALESCE(SUM(duration_seconds), 0) AS totalSeconds
     FROM listening_sessions WHERE user_id = ?`
  ).bind(userId).first();

  const favourite = await env.DB.prepare(
    `SELECT track_name, SUM(duration_seconds) AS total FROM listening_sessions
     WHERE user_id = ? AND track_name IS NOT NULL
     GROUP BY track_name ORDER BY total DESC LIMIT 1`
  ).bind(userId).first();

  return {
    hours: Math.round(((totals?.totalSeconds || 0) / 3600) * 10) / 10,
    sessions: totals?.sessions || 0,
    favourite: favourite?.track_name || null,
  };
}
