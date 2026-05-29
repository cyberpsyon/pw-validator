import { useRef, useState } from 'react';
import '../App.css';

import { fullValidate } from '../lib/validator.js';
import { checkHIBP } from '../lib/hibp.js';

import { PasswordInput } from './PasswordInput.jsx';
import { ScoreDisplay } from './ScoreDisplay.jsx';
import { ThreatGauge } from './ThreatGauge.jsx';
import { RuleAnalysis } from './RuleAnalysis.jsx';
import { Recommendations } from './Recommendations.jsx';
import { AttackBreakdown } from './AttackBreakdown.jsx';
import { PolicyCompliance } from './PolicyCompliance.jsx';
import { ShareCard } from './ShareCard.jsx';
import { GeneratorPanel } from './GeneratorPanel.jsx';
import { PassphrasePanel } from './PassphrasePanel.jsx';
import { SafetyTips } from './SafetyTips.jsx';
import { ScoringExplainer } from './ScoringExplainer.jsx';

export default function App() {
  const [password, setPassword] = useState('');
  const [phase, setPhase] = useState('idle'); // idle | checking | done
  const [result, setResult] = useState(null);

  // Monotonic token: each handleValidate run claims an id, and any async
  // resolution belonging to a superseded run is ignored. Prevents a slow
  // HIBP fetch from overwriting state after the input has changed.
  const runIdRef = useRef(0);

  function handleChange(value) {
    setPassword(value);
    // Invalidate any in-flight run and clear stale analysis on input change.
    runIdRef.current += 1;
    if (result) setResult(null);
    if (phase !== 'idle') setPhase('idle');
  }

  async function handleValidate() {
    if (!password) return;
    const runId = ++runIdRef.current;
    setPhase('checking');

    // Phase 1: sync validation with the breach check still pending — shown
    // immediately so the user sees everything except the breach result.
    setResult(fullValidate(password, { pending: true }));

    // Phase 2: run the HIBP check, then re-validate with the real count.
    const hibpResult = await checkHIBP(password);
    if (runId !== runIdRef.current) return; // superseded
    setResult(fullValidate(password, hibpResult));
    setPhase('done');
  }

  return (
    <div className="container">
      <header className="app-header">
        <h1 className="app-title">Password Validator</h1>
        <p className="app-tagline">
          Strength analysis that never leaves your device.
        </p>
      </header>

      <PasswordInput
        value={password}
        onChange={handleChange}
        onValidate={handleValidate}
        disabled={phase === 'checking'}
      />

      {result && (
        <>
          <ScoreDisplay result={result} phase={phase} />

          {result.hibpUnavailable && (
            <div className="hibp-warning">
              The breach database check could not be completed. This password has NOT been
              verified against known breaches. Retry when you have network connectivity.
            </div>
          )}

          <ThreatGauge crackSeconds={result.crackSeconds} crackTime={result.crackTime} />
          <RuleAnalysis result={result} phase={phase} />
          <Recommendations result={result} />

          <div className="deep-divider">
            <span>Deep analysis</span>
          </div>

          <AttackBreakdown sequence={result.attackSequence} />
          <PolicyCompliance result={result} />
          <ShareCard result={result} />
        </>
      )}

      <GeneratorPanel onUse={handleChange} />
      <PassphrasePanel onUse={handleChange} />

      <ScoringExplainer />
      <SafetyTips />

      <footer className="app-footer">
        BUILT BY BEN MICKENS ·{' '}
        <a
          href="https://github.com/cyberpsyon/password-validator"
          target="_blank"
          rel="noreferrer"
        >
          [ SOURCE: GITHUB ]
        </a>
      </footer>
    </div>
  );
}
