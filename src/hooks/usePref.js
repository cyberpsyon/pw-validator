import { useEffect, useState } from 'react';

// localStorage-backed preference with a default fallback.
export function usePref(key, fallback) {
  const [value, setValue] = useState(() => {
    try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); }
    catch { return fallback; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
  }, [key, value]);
  return [value, setValue];
}
