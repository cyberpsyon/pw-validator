import { useRef, useState } from 'react';
import { downloadNodeAsPng } from '../lib/shareImage.js';

// Update once the Cloudflare Pages URL is known (Step 11).
const SITE_URL = 'pw-validator.pages.dev';

function todayISO() {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';
}

function CheckRow({ passed, text }) {
  return (
    <div className={`share-check ${passed ? 'tier-good' : 'tier-bad'}`}>
      {passed ? '✓' : '✗'} {text}
    </div>
  );
}

export function ShareCard({ result }) {
  const cardRef = useRef(null);
  const [copied, setCopied] = useState(false);
  if (!result) return null;

  const date = todayISO();
  const nistPass = result.compliance.nist_length && result.compliance.nist_breach;
  const crackResistant = result.crackSeconds >= 3_153_600_000; // 100 years

  let breachRow;
  if (result.hibpUnavailable) {
    breachRow = <CheckRow passed={false} text="Breach database check unavailable" />;
  } else if (!result.breachFound) {
    breachRow = <CheckRow passed text="Not found in Have I Been Pwned breach database" />;
  } else {
    const c = result.hibpCount != null ? ` (${result.hibpCount.toLocaleString()} breaches)` : '';
    breachRow = <CheckRow passed={false} text={`Found in Have I Been Pwned breach database${c}`} />;
  }

  const summary =
    `Password Validator — Security Report (${date})\n` +
    `Score: ${result.score}/${result.maxScore} · ${result.rating}\n` +
    `Crack time: ${capitalize(result.crackTime)}\n` +
    `${SITE_URL}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable */ }
  }

  return (
    <section className="share-card">
      <div className="share-report" ref={cardRef}>
        <div className="share-bar">
          <span className="share-bar-title">Password Validator // Security Report</span>
          <span className="share-bar-date">{date}</span>
        </div>

        <div className="share-inner">
          <div className="share-stats">
            <div className="share-stat">
              <div className="share-stat-lbl">Score</div>
              <div className={`share-stat-score rating-${result.rating}`}>
                {result.score}<span className="share-of">/{result.maxScore}</span>
              </div>
            </div>
            <div className="share-stat">
              <div className="share-stat-lbl">Rating</div>
              <div className={`share-rating-badge rating-${result.rating}`}>{result.rating}</div>
            </div>
            <div className="share-stat">
              <div className="share-stat-lbl">Crack time</div>
              <div className={`share-stat-crack rating-${result.rating}`}>
                {capitalize(result.crackTime)}
              </div>
            </div>
          </div>

          <div className="share-checks">
            {breachRow}
            <CheckRow passed={nistPass}
              text={nistPass ? 'NIST SP 800-63B compliant' : 'Does not meet NIST SP 800-63B'} />
            <CheckRow passed={crackResistant}
              text={crackResistant ? 'Resists offline brute-force attack' : 'Vulnerable to offline brute-force attack'} />
          </div>

          <div className="share-footer">
            <span>{SITE_URL}</span>
            <span>Built by Ben Mickens</span>
          </div>
        </div>
      </div>

      <div className="share-actions">
        <button type="button" className="copy-btn" onClick={copy}>
          {copied ? 'copied' : 'copy summary'}
        </button>
        <button type="button" className="copy-btn" onClick={() => downloadNodeAsPng(cardRef.current)}>
          download png
        </button>
      </div>
    </section>
  );
}
