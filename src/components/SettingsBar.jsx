import { useEffect, useSyncExternalStore } from 'react';
import { ThemeToggle } from './ThemeToggle.jsx';
import { usePref } from '../hooks/usePref.js';
import { getManualReduceMotion, setManualReduceMotion, subscribeMotion } from '../lib/motionPref.js';
import { setSoundEnabled } from '../lib/sound.js';

export function SettingsBar() {
  const noMotion = useSyncExternalStore(subscribeMotion, getManualReduceMotion, () => false);
  const [sound, setSound] = usePref('pv-sound', false);

  useEffect(() => { setSoundEnabled(sound); }, [sound]);

  return (
    <div className="settings-bar">
      <ThemeToggle />
      <button
        type="button"
        className="settings-btn"
        aria-pressed={noMotion}
        onClick={() => setManualReduceMotion(!noMotion)}
      >
        {noMotion ? 'motion off' : 'motion on'}
      </button>
      <button
        type="button"
        className="settings-btn"
        aria-pressed={sound}
        onClick={() => setSound(v => !v)}
      >
        {sound ? 'sound on' : 'sound off'}
      </button>
    </div>
  );
}
