import { useEffect, useRef, useState } from 'react';

// Eased rAF tween toward `target`. On first mount it animates from `from`
// (default 0) so values like the score count up on the initial reveal;
// subsequent target changes animate from the current value. When `enabled`
// is false (reduced motion), it snaps to the target instantly.
export function useTween(target, duration = 400, enabled = true, from = 0) {
  const [tweenValue, setTweenValue] = useState(enabled ? from : target);
  const valueRef = useRef(enabled ? from : target);
  const rafRef = useRef(0);

  useEffect(() => { valueRef.current = tweenValue; });

  useEffect(() => {
    if (!enabled) { return; }
    const from = valueRef.current;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setTweenValue(from + (target - from) * eased);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration, enabled]);

  return enabled ? tweenValue : target;
}
