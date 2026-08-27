import { useCallback, useEffect, useState } from 'react';

// Installing Cadenzia to the home screen / desktop.
//
// Two paths, because the platforms differ:
//   • Chrome, Edge, Android — fire `beforeinstallprompt`, which we captured in
//     main.jsx before React mounted (it fires once, early). We can then show a
//     real button that opens the browser's install dialog.
//   • iOS Safari — has no such event and no programmatic install at all. The
//     only route is Share → Add to Home Screen, so there we show instructions
//     instead of a button. Pretending otherwise would give iOS users a button
//     that does nothing.
//
// Nothing here nags: the browser's own banner is suppressed in main.jsx, the
// prompt only appears where we place it, and the dismissal is remembered.

const DISMISSED_KEY = 'cad_install_dismissed';

function isStandalone() {
  try {
    return (
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
  } catch {
    return false;
  }
}

function isIOS() {
  try {
    const ua = navigator.userAgent || '';
    // iPadOS 13+ reports itself as a Mac, so touch points are the giveaway.
    return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  } catch {
    return false;
  }
}

function readDismissed() {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

export function useInstallPrompt() {
  const [deferred, setDeferred] = useState(() => window.__cadInstallEvent || null);
  const [installed, setInstalled] = useState(isStandalone);
  const [dismissed, setDismissed] = useState(readDismissed);

  useEffect(() => {
    // Either the event arrived before us (stashed on window) or it lands later.
    const onInstallable = () => setDeferred(window.__cadInstallEvent || null);
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      window.__cadInstallEvent = null;
    };
    window.addEventListener('cad:installable', onInstallable);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('cad:installable', onInstallable);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const e = deferred || window.__cadInstallEvent;
    if (!e) return false;
    try {
      e.prompt();
      await e.userChoice;
    } catch {
      /* dialog dismissed or unavailable — nothing to recover */
    }
    // The event is single-use; a declined install can't be re-prompted from
    // the same one, so drop it either way.
    window.__cadInstallEvent = null;
    setDeferred(null);
    return true;
  }, [deferred]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      /* private mode — it'll simply reappear next session */
    }
  }, []);

  return {
    installed,
    dismissed,
    canPrompt: !!deferred && !installed,
    showIosHint: isIOS() && !installed && !deferred,
    promptInstall,
    dismiss,
  };
}
