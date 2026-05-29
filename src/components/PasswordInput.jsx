import { useState } from 'react';

export function PasswordInput({ value, onChange, onValidate, disabled }) {
  const [reveal, setReveal] = useState(false);

  function handleKeyDown(e) {
    if (e.key === 'Enter') onValidate();
  }

  return (
    <div className="password-input">
      <label className="field-label" htmlFor="pw">Password</label>

      <div className="input-row">
        <input
          id="pw"
          type={reveal ? 'text' : 'password'}
          className="pw-field"
          value={value}
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck="false"
          placeholder="Enter a password to analyze"
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="reveal-btn"
          aria-pressed={reveal}
          onClick={() => setReveal(r => !r)}
        >
          {reveal ? 'hide' : 'show'}
        </button>
      </div>

      {/* Alternating disclaimer — carries over from the Streamlit version */}
      <div className="disclaimer-wrap">
        <span className="pv-left">YOUR PASSWORD IS NEVER SENT TO ANY SERVER OR STORED.</span>
        <span className="pv-right">CHECK YOUR SURROUNDINGS BEFORE REVEALING YOUR PASSWORD.</span>
      </div>

      <button
        type="button"
        className="validate-btn"
        onClick={onValidate}
        disabled={disabled || !value}
      >
        Analyze
      </button>
    </div>
  );
}
