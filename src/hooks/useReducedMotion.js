import { useEffect, useState } from 'react';

// True when the OS `prefers-reduced-motion` setting asks for reduced motion.
// Gates JS-driven animation (e.g. useTween); CSS animations are handled by the
// matching `@media (prefers-reduced-motion: reduce)` rules.
export function useReducedMotion() {
  const compute = () =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const [reduced, setReduced] = useState(compute);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(compute());
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return reduced;
}
