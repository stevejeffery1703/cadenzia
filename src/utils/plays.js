// The play counter — honest social proof. Total tracks played across all users,
// incremented server-side on track completion and read back for the landing
// page. No personal data; just a number that grows on its own.

import { api, deviceId } from './api';

export async function recordPlay() {
  try {
    await api('/plays/increment', { method: 'POST', body: { device: deviceId() } });
  } catch {
    /* never let a counter ping interrupt listening */
  }
}

export async function getPlayCount() {
  try {
    const { count } = await api('/plays/count');
    return typeof count === 'number' ? count : null;
  } catch {
    return null;
  }
}
