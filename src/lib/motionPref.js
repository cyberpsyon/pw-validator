// Shared "reduce motion" preference (manual, in-app toggle), persisted to
// localStorage. It is honored by BOTH the CSS layer (via the
// `force-reduce-motion` class on <html>) and the JS layer (useReducedMotion
// subscribes here), so toggling it off stops every animation — CSS and
// rAF-driven alike. This is separate from, and combined with, the OS-level
// `prefers-reduced-motion` media query.

const KEY = 'pv-reduce-motion';
const listeners = new Set();

function load() {
  try {
    const v = localStorage.getItem(KEY);
    return v === null ? false : JSON.parse(v) === true;
  } catch {
    return false;
  }
}

let manual = load();

function applyClass() {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('force-reduce-motion', manual);
  }
}

// Apply the persisted choice as soon as this module loads.
applyClass();

export function getManualReduceMotion() {
  return manual;
}

export function setManualReduceMotion(value) {
  manual = value === true;
  try { localStorage.setItem(KEY, JSON.stringify(manual)); } catch { /* ignore */ }
  applyClass();
  listeners.forEach((fn) => fn());
}

export function subscribeMotion(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
