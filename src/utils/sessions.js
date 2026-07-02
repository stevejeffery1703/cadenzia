// Per-user listening history, recorded only for signed-in listeners — powers
// the subscriber stats panel on /account. Never blocks playback if it fails.

import { api } from './api';

export async function recordSession({ trackId, trackName, durationSeconds }) {
  try {
    await api('/sessions/record', {
      method: 'POST',
      auth: true,
      body: { trackId, trackName, durationSeconds },
    });
  } catch {
    /* best effort — never interrupt listening over a stats write */
  }
}
