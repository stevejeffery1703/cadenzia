// Signed download links for subscribers — see worker/routes/download.js.

import { api } from './api';

export async function getDownloadLink(trackId) {
  const { url } = await api('/download/link', {
    method: 'POST',
    auth: true,
    body: { trackId },
  });
  return url;
}
