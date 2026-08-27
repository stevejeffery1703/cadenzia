import { APP_NAME } from '../utils/config';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

// The offer to install Cadenzia to the home screen. Never a popup, never a
// banner over the music — a quiet line where the listener already is.
//
// Two placements, deliberately different:
//   • `dismissible` (the player) — a gentle nudge that can be sent away for
//     good, because nobody should meet the same ask every session.
//   • not dismissible (the account page) — the permanent home for it, so
//     dismissing the nudge loses the prompt, never the ability.
//
// Renders nothing when already installed, or when the platform can't install.
export default function InstallPrompt({ dismissible = false, className = '' }) {
  const { installed, dismissed, canPrompt, showIosHint, promptInstall, dismiss } =
    useInstallPrompt();

  if (installed) return null;
  if (dismissible && dismissed) return null;
  if (!canPrompt && !showIosHint) return null;

  return (
    <div className={`rounded-lg border border-line bg-paper-wash px-4 py-3.5 ${className}`}>
      <p className="text-sm text-ink">Add {APP_NAME} to your home screen</p>
      <p className="text-caption mt-1">
        {showIosHint
          ? 'Tap the Share button, then “Add to Home Screen”.'
          : 'Opens straight to the player, without the browser around it.'}
      </p>

      {canPrompt && (
        <button type="button" onClick={promptInstall} className="btn-ghost mt-3 px-4 py-1.5 text-sm">
          Add to home screen
        </button>
      )}

      {dismissible && (
        <button
          type="button"
          onClick={dismiss}
          className="text-label mt-3 block text-ink-soft hover:text-ink"
        >
          No thanks
        </button>
      )}
    </div>
  );
}
