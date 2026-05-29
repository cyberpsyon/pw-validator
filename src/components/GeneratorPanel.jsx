import { useState } from 'react';
import { generatePassword } from '../lib/generator.js';
import { MIN_LENGTH, MAX_LENGTH } from '../lib/validator.js';

const TOGGLES = [
  { key: 'useUpper',   label: 'Uppercase' },
  { key: 'useLower',   label: 'Lowercase' },
  { key: 'useDigits',  label: 'Digits' },
  { key: 'useSpecial', label: 'Symbols' },
];

export function GeneratorPanel({ onUse }) {
  const [length, setLength] = useState(20);
  const [opts, setOpts] = useState({
    useUpper: true, useLower: true, useDigits: true, useSpecial: true,
  });
  const [output, setOutput] = useState('');
  const [copied, setCopied] = useState(false);

  const noneSelected = !Object.values(opts).some(Boolean);

  function regenerate() {
    const pw = generatePassword({ length, ...opts });
    setOutput(pw ?? '');
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
      <h3 className="section-heading">Generate a password</h3>

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
