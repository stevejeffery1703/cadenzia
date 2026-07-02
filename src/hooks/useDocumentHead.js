import { useEffect } from 'react';

// Per-route title + meta description. This is a client-rendered SPA with one
// static index.html, so without this every route would share the homepage's
// title/description in search results and (for crawlers that execute JS,
// which Googlebot does) in the index. No new dependency — react-helmet-style
// context/dedup machinery solves a problem this app's 7 routes don't have.
export function useDocumentHead({ title, description }) {
  useEffect(() => {
    const prevTitle = document.title;
    if (title) document.title = title;

    const meta = document.querySelector('meta[name="description"]');
    const prevDescription = meta?.getAttribute('content');
    if (description && meta) meta.setAttribute('content', description);

    return () => {
      document.title = prevTitle;
      if (meta && prevDescription != null) meta.setAttribute('content', prevDescription);
    };
  }, [title, description]);
}
