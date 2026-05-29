import { useState } from 'react';
import { generatePassphrase } from '../lib/generator.js';

const SEPARATORS = [
  { value: '-', label: 'Hyphen (-)' },
  { value: ' ', label: 'Space' },
  { value: '.', label: 'Period (.)' },
  { value: '_', label: 'Underscore (_)' },
  { value: '', label: 'None' },
];

const TOGGLES = [
  { key: 'useUpper',   label: 'Capitalize' },
  { key: 'useLeet',    label: 'Leetspeak' },
  { key: 'useDigits',  label: 'Append digits' },
  { key: 'useSpecial', label: 'Append symbol' },
];

export function PassphrasePanel({ onUse }) {
  const [wordCount, setWordCount] = useState(4);
  const [separator, setSeparator] = useState('-');
  const [opts, setOpts] = useState({
    useUpper: true, useLeet: false, useDigits: false, useSpecial: false,
  });
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  function regenerate() {
    setOutput(generatePassphrase({ wordCount, separator, ...opts }));
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
    <section className="passphrase-panel">
      <h3 className="section-heading">Generate a passphrase</h3>
      <p className="section-note">Diceware words from the EFF large wordlist.</p>

      <div className="gen-controls">
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
          {TOGGLES.map(t => (
            <label key={t.key} className="gen-toggle">
              <input
                type="checkbox"
                checked={opts[t.key]}
                onChange={e => setOpts(o => ({ ...o, [t.key]: e.target.checked }))}
              />
              {t.label}
            </label>
          ))}
        </div>
      </div>

      {output && (
        <div className="gen-output">
          <code className="gen-value">{output}</code>
        </div>
      )}

      <div className="gen-actions">
        <button type="button" className="validate-btn" onClick={regenerate}>
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
