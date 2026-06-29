import { useEffect, useState } from 'react';
import { getManualReduceMotion, subscribeMotion } from '../lib/motionPref.js';

// True when motion should be reduced — either the OS `prefers-reduced-motion`
// setting OR the in-app manual toggle. Gates JS-driven animation (e.g.
// useTween); CSS animations are additionally handled via media query and the
// `force-reduce-motion` class.
export function useReducedMotion() {
  const compute = () =>
    (typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) ||
    getManualReduceMotion();

  const [reduced, setReduced] = useState(compute);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(compute());
    mq.addEventListener('change', update);
    const unsubscribe = subscribeMotion(update);
    return () => {
      mq.removeEventListener('change', update);
      unsubscribe();
    };
  }, []);

  return reduced;
}
