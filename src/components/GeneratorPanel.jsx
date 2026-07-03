import { useState } from 'react';
import { generatePassword, generatePassphrase } from '../lib/generator.js';
import { MIN_LENGTH, MAX_LENGTH } from '../lib/validator-core.js';

const PW_TOGGLES = [
  { key: 'useUpper',   label: 'Uppercase' },
  { key: 'useLower',   label: 'Lowercase' },
  { key: 'useDigits',  label: 'Digits' },
  { key: 'useSpecial', label: 'Symbols' },
];

const PP_TOGGLES = [
  { key: 'useUpper',   label: 'Capitalize' },
  { key: 'useLeet',    label: 'Leetspeak' },
  { key: 'useDigits',  label: 'Append digits' },
  { key: 'useSpecial', label: 'Append symbol' },
];

const SEPARATORS = [
  { value: '-', label: 'Hyphen (-)' },
  { value: ' ', label: 'Space' },
  { value: '.', label: 'Period (.)' },
  { value: '_', label: 'Underscore (_)' },
  { value: '', label: 'None' },
];

export function GeneratorPanel({ onUse }) {
  const [mode, setMode] = useState('password'); // 'password' | 'passphrase'

  // Password-mode settings.
  const [length, setLength] = useState(20);
  const [pwOpts, setPwOpts] = useState({
    useUpper: true, useLower: true, useDigits: true, useSpecial: true,
  });

  // Passphrase-mode settings.
  const [wordCount, setWordCount] = useState(4);
  const [separator, setSeparator] = useState('-');
  const [ppOpts, setPpOpts] = useState({
    useUpper: true, useLeet: false, useDigits: false, useSpecial: false,
  });

  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const noneSelected = mode === 'password' && !Object.values(pwOpts).some(Boolean);

  // Switching modes clears the output but preserves each mode's settings.
  function switchMode(next) {
    if (next === mode) return;
    setMode(next);
    setOutput('');
    setCopied(false);
  }

  function regenerate() {
    const value = mode === 'password'
      ? generatePassword({ length, ...pwOpts })
      : generatePassphrase({ wordCount, separator, ...ppOpts });
    setOutput(value ?? '');
    setCopied(false);
  }

  async function copy() {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  }

  return (
    <section className="generator-panel">
      <h3 className="section-heading">Generate a strong password</h3>

      <div className="gen-mode" role="tablist" aria-label="Generator mode">
        <button
          type="button" role="tab" aria-selected={mode === 'password'}
          className="gen-mode-btn" onClick={() => switchMode('password')}
        >
          Password
        </button>
        <button
          type="button" role="tab" aria-selected={mode === 'passphrase'}
          className="gen-mode-btn" onClick={() => switchMode('passphrase')}
        >
          Passphrase
        </button>
      </div>

      {mode === 'password' ? (
        <div className="gen-controls">
          <label className="gen-length">
            <span>Length</span>
            <input
              type="range" min={MIN_LENGTH} max={MAX_LENGTH} value={length}
              onChange={e => setLength(Number(e.target.value))}
            />
            <span className="gen-length-val">{length}</span>
          </label>

          <div className="gen-toggles">
            {PW_TOGGLES.map(t => (
              <label key={t.key} className="gen-toggle">
                <input
                  type="checkbox"
                  checked={pwOpts[t.key]}
                  onChange={e => setPwOpts(o => ({ ...o, [t.key]: e.target.checked }))}
                />
                {t.label}
              </label>
            ))}
          </div>
        </div>
      ) : (
        <div className="gen-controls">
          <p className="section-note">Diceware words from the EFF large wordlist.</p>

          <label className="gen-length">
            <span>Words</span>
            <input
              type="range" min="3" max="8" value={wordCount}
              onChange={e => setWordCount(Number(e.target.value))}
            />
            <span className="gen-length-val">{wordCount}</span>
          </label>

          <label className="gen-sep">
            <span>Separator</span>
            <select value={separator} onChange={e => setSeparator(e.target.value)}>
              {SEPARATORS.map(s => (
                <option key={s.label} value={s.value}>{s.label}</option>
              ))}
            </select>
          </label>

          <div className="gen-toggles">
            {PP_TOGGLES.map(t => (
              <label key={t.key} className="gen-toggle">
                <input
                  type="checkbox"
                  checked={ppOpts[t.key]}
                  onChange={e => setPpOpts(o => ({ ...o, [t.key]: e.target.checked }))}
                />
                {t.label}
              </label>
            ))}
          </div>
        </div>
      )}

      {output && (
        <div className="gen-output">
          <code className="gen-value">{output}</code>
        </div>
      )}

      <div className="gen-actions">
        <button type="button" className="validate-btn" onClick={regenerate} disabled={noneSelected}>
          Generate
        </button>
        {output && (
          <>
            <button type="button" className="copy-btn" onClick={copy}>
              {copied ? 'copied' : 'copy'}
            </button>
            {onUse && (
              <button type="button" className="copy-btn" onClick={() => onUse(output)}>
                test it
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
