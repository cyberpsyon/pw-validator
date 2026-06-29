import { useSyncExternalStore } from 'react';
import { ThemeToggle } from './ThemeToggle.jsx';
import { getManualReduceMotion, setManualReduceMotion, subscribeMotion } from '../lib/motionPref.js';

export function SettingsBar() {
  const noMotion = useSyncExternalStore(subscribeMotion, getManualReduceMotion, () => false);

  return (
    <div className="settings-bar">
      <button
        type="button"
        className="settings-btn"
        aria-pressed={noMotion}
        onClick={() => setManualReduceMotion(!noMotion)}
      >
        {noMotion ? 'motion off' : 'motion on'}
      </button>
      <ThemeToggle />
    </div>
  );
}
