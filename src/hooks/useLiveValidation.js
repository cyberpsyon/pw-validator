import { useEffect, useRef, useState } from 'react';
import { validateAsync } from '../lib/validatorClient.js';
import { checkHIBP } from '../lib/hibp.js';

// Live validation: instant-ish local analysis (debounced) plus a deferred HIBP
// breach check. A monotonic run token guards against stale async resolutions.
export function useLiveValidation(password, { localDelay = 120, hibpDelay = 600 } = {}) {
  const [result, setResult] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | checking | done
  const runRef = useRef(0);

  useEffect(() => {
    if (!password) {
      // Cancel any in-flight run. We deliberately do NOT setState here; the
      // returned values are gated by `password`, which avoids a synchronous
      // setState-in-effect and any stale-result flash when the field clears.
      runRef.current++;
      return;
    }
    const runId = ++runRef.current;

    const localTimer = setTimeout(async () => {
      const partial = await validateAsync(password, { pending: true });
      if (runId !== runRef.current) return;
      setResult(partial);
      setPhase('checking');
    }, localDelay);

    const hibpTimer = setTimeout(async () => {
      const hibp = await checkHIBP(password);
      if (runId !== runRef.current) return;
      const full = await validateAsync(password, hibp);
      if (runId !== runRef.current) return;
      setResult(full);
      setPhase('done');
    }, hibpDelay);

    return () => { clearTimeout(localTimer); clearTimeout(hibpTimer); };
  }, [password, localDelay, hibpDelay]);

  // Gate exposed state by `password` so an empty field reads as a clean idle
  // state without writing state inside the effect.
  return {
    result: password ? result : null,
    phase: password ? phase : 'idle',
    isEmpty: !password,
  };
}
