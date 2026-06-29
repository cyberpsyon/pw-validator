import { useEffect } from 'react';
import { usePref } from '../hooks/usePref.js';

export function ThemeToggle() {
  const initial = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  const [theme, setTheme] = usePref('pv-theme', initial);

  useEffect(() => {
    document.documentElement.dataset.theme = theme === 'light' ? 'light' : 'dark';
  }, [theme]);

  const isLight = theme === 'light';

  return (
    <button
      type="button"
      className="settings-btn theme-toggle"
      aria-label={isLight ? 'Switch to dark theme' : 'Switch to light theme'}
      onClick={() => setTheme(t => (t === 'light' ? 'dark' : 'light'))}
    >
      {isLight ? (
        /* Sun — current theme is light */
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      ) : (
        /* Moon — current theme is dark */
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
