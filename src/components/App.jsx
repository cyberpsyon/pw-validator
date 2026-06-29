import { useEffect, useRef, useState } from 'react';
import '../App.css';

import { useLiveValidation } from '../hooks/useLiveValidation.js';
import { PasswordInput } from './PasswordInput.jsx';
import { EmptyState } from './EmptyState.jsx';
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
import { SettingsBar } from './SettingsBar.jsx';

export default function App() {
  const [password, setPassword] = useState('');
  const { result, phase, isEmpty } = useLiveValidation(password);

  // One-time reveal when transitioning empty -> active.
  const [revealed, setRevealed] = useState(false);
  const wasEmpty = useRef(true);
  useEffect(() => {
    const prev = wasEmpty.current;
    wasEmpty.current = isEmpty;
    if (prev && !isEmpty) setTimeout(() => { setRevealed(true); }, 0);
    if (isEmpty) setTimeout(() => setRevealed(false), 0);
  }, [isEmpty]);

  return (
    <div className="container">
      <SettingsBar />
      <header className="app-header">
        <h1 className="app-title">How strong is your <span className="app-title-accent">password</span>?</h1>
        <p className="app-tagline">An audit against 850M breached passwords and modern cracking benchmarks. No accounts, no logging, no storage.</p>
      </header>

      <PasswordInput value={password} onChange={setPassword} />

      {isEmpty && <EmptyState onPick={setPassword} />}

      {result && (
        <div className={revealed ? 'results results-reveal' : 'results'} aria-busy={phase === 'checking'}>
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

          <div className="deep-divider"><span>Deep analysis</span></div>

          <AttackBreakdown sequence={result.attackSequence} />
          <PolicyCompliance result={result} />
          <ShareCard result={result} />
        </div>
      )}

      <GeneratorPanel onUse={setPassword} />
      <PassphrasePanel onUse={setPassword} />

      <ScoringExplainer />
      <SafetyTips />

      <footer className="app-footer">
        BUILT BY BEN MICKENS ·{' '}
        <a href="https://github.com/cyberpsyon/pw-validator" target="_blank" rel="noreferrer">
          [ SOURCE: GITHUB ]
        </a>
      </footer>
    </div>
  );
}
