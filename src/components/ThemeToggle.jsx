import { useEffect } from 'react';
import { usePref } from '../hooks/usePref.js';

export function ThemeToggle() {
  const initial = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  const [theme, setTheme] = usePref('pv-theme', initial);

  useEffect(() => {
    document.documentElement.dataset.theme = theme === 'light' ? 'light' : 'dark';
  }, [theme]);

  return (
    <button type="button" className="settings-btn" aria-pressed={theme === 'light'}
      onClick={() => setTheme(t => (t === 'light' ? 'dark' : 'light'))}>
      {theme === 'light' ? 'dark' : 'light'} theme
    </button>
  );
}
