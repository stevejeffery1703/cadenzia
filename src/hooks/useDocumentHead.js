import { useEffect } from 'react';
import { APP_URL } from '../utils/config';
import { PAGE_META } from '../utils/pageMeta';

// Per-route title + meta description + canonical link, driven by the single
// PAGE_META source (also read by the Worker's HTMLRewriter, so the two can't
// drift apart). This is a client-rendered SPA with one static index.html, so
// without this every route would share the homepage's title/description in
// search results and (for crawlers that execute JS, which Googlebot does) in
// the index. No new dependency — react-helmet-style context/dedup machinery
// solves a problem this app's 7 routes don't have.
export function useDocumentHead(path) {
  const meta = PAGE_META[path];

  useEffect(() => {
    const prevTitle = document.title;
    if (meta?.title) document.title = meta.title;

    const descTag = document.querySelector('meta[name="description"]');
    const prevDescription = descTag?.getAttribute('content');
    if (meta?.description && descTag) descTag.setAttribute('content', meta.description);

    let canonical;
    if (path) {
      canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', `${APP_URL}${path}`);
    }

    return () => {
      document.title = prevTitle;
      if (descTag && prevDescription != null) descTag.setAttribute('content', prevDescription);
      if (path && canonical) canonical.remove();
    };
  }, [path, meta]);
}
