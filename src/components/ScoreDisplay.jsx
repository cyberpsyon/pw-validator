import { EnsoCircle } from './EnsoCircle.jsx';
import { crackTimeTier, breachTier, lengthTier, formatBreachCount } from '../lib/validator.js';
import { useTween } from '../hooks/useTween.js';
import { useReducedMotion } from '../hooks/useReducedMotion.js';

function capitalize(s) {
  if (!s) return '—';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function ScoreDisplay({ result, phase }) {
  const reduced = useReducedMotion();
  const animatedScore = Math.round(useTween(result?.score ?? 0, 700, !reduced));
  if (!result) return null;
  const checking = phase === 'checking' || result.hibpPending;

  const crackVal  = capitalize(result.crackTime);
  const crackT    = crackTimeTier(result.crackSeconds);

  const breachVal = checking
    ? 'Checking…'
    : result.hibpUnavailable ? 'Unknown' : formatBreachCount(result.hibpCount);
  const breachT   = checking ? 'unknown' : breachTier(result.hibpCount, result.hibpUnavailable);

  const lengthVal = `${result.length} chars`;
  const lengthT   = lengthTier(result.length);

  const metrics = [
    { label: 'Crack time',   value: crackVal,  tier: crackT },
    { label: 'Breach check', value: breachVal, tier: breachT },
    { label: 'Length',       value: lengthVal, tier: lengthT },
  ];

  return (
    <section className="score-display">
      <div className="enso-holder">
        <EnsoCircle score={animatedScore} rating={result.rating} />
      </div>

      <div className="score-breakdown">
        {metrics.map(m => (
          <div key={m.label} className="metric-row">
            <span className="metric-lbl">
              <span className={`metric-dot tier-${m.tier}`} />
              {m.label}
            </span>
            <span className={`metric-val tier-${m.tier}`}>{m.value}</span>
          </div>
        ))}
      </div>
      <span className="sr-only" aria-live="polite">
        Score {result.score} of {result.maxScore}, rating {result.rating}
      </span>
    </section>
  );
}
