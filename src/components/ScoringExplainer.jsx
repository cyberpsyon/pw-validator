import { useState } from 'react';

// Content ported from render_scoring_panel() in app.py. Emphasis colors
// adapted to the navy/mint palette (#F5A623 -> --mint, #00E676 -> --green).

const POINT_BREAKDOWN = [
  ['Length (15+ characters)', '10'],
  ['Contains uppercase letters', '5'],
  ['Contains lowercase letters', '5'],
  ['Contains numbers', '5'],
  ['Contains special characters', '5'],
  ['Not found in breach databases', '20'],
  ['Crack-time resistance', '0–50'],
];

const CRACK_TABLE = [
  ['Less than 1 second', '0'],
  ['Less than 1 minute', '5'],
  ['Less than 1 hour', '10'],
  ['Less than 1 day', '20'],
  ['Less than 1 year', '30'],
  ['Less than 100 years', '40'],
  ['100+ years', '50'],
];

const RATING_TABLE = [
  ['EXCELLENT', '100'],
  ['STRONG', '80–95'],
  ['GOOD', '60–75'],
  ['FAIR', '40–55'],
  ['WEAK', 'Below 40'],
];

export function ScoringExplainer() {
  const [open, setOpen] = useState(false);

  return (
    <section className="scoring-explainer">
      <button
        type="button"
        className="disclosure"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
      >
        <span className="disclosure-mark">{open ? '−' : '+'}</span>
        How scoring works
      </button>

      {open && (
        <div className="explainer-body">
          <p>
            Your password is scored out of <strong>100 points</strong> across 7 categories.
            Crack-time resistance carries the most weight because it directly measures
            real-world entropy. Character diversity rules are useful nudges, not a
            substitute for genuine unpredictability.
          </p>

          <h4>Point breakdown</h4>
          <table className="explainer-table">
            <thead><tr><th>Category</th><th>Points</th></tr></thead>
            <tbody>
              {POINT_BREAKDOWN.map(([cat, pts]) => (
                <tr key={cat}><td>{cat}</td><td className="score-pts">{pts}</td></tr>
              ))}
            </tbody>
          </table>

          <h4>Breach database checks</h4>
          <p>
            Your password is checked against{' '}
            <a href="https://haveibeenpwned.com" target="_blank" rel="noreferrer">Have I Been Pwned</a>,
            a database of over 900 million passwords collected from hundreds of real-world data
            breaches. If your password appears here, it means someone, somewhere, has already used
            it, and attackers have it too. Your password is checked privately using k-anonymity:
            only the first 5 characters of its hash are ever transmitted, so your actual password
            never leaves your device.
          </p>
          <p>
            Attackers commonly use wordlists like{' '}
            <a href="https://en.wikipedia.org/wiki/RockYou" target="_blank" rel="noreferrer">rockyou.txt</a>,
            a list of 14 million real passwords leaked in the 2009 RockYou breach, as their first
            line of attack. Have I Been Pwned contains rockyou.txt and far more, making it the
            definitive check.
          </p>

          <h4>Crack-time resistance</h4>
          <p>
            This category uses{' '}
            <a href="https://dropbox.tech/security/zxcvbn-realistic-password-strength-estimation" target="_blank" rel="noreferrer">zxcvbn</a>{' '}
            pattern analysis to estimate how long a real-world attacker would need to crack your
            password assuming bcrypt hashing at 10,000 guesses per second. At 50 points it is the
            single largest factor in your score.
          </p>
          <table className="explainer-table">
            <thead><tr><th>Estimated crack time</th><th>Points</th></tr></thead>
            <tbody>
              {CRACK_TABLE.map(([t, pts]) => (
                <tr key={t}><td>{t}</td><td className="score-pts">{pts}</td></tr>
              ))}
            </tbody>
          </table>

          <h4>Entropy: what are bits and guesses?</h4>
          <p>
            Alongside your score, entropy is measured in <strong>bits</strong>. Entropy measures how
            unpredictable your password is, not how complex it looks, but how many attempts an
            attacker would need to guess it.
          </p>
          <p>
            <strong>Bits</strong> are the unit. Each additional bit doubles the number of guesses
            required. Think of it like this: 10 bits = ~1,000 guesses. 20 bits = ~1 million. 40 bits
            = ~1 trillion. Every bit you add makes the attacker's job exponentially harder, not just
            a little harder.
          </p>
          <p>
            <strong>Guesses</strong> is the same number in plain English: the raw count of attempts
            a computer would make before it's likely to crack your password. A modern offline attack
            can test billions of guesses per second, so anything under a few trillion (~42 bits) is
            reachable with enough hardware and time.
          </p>
          <p>
            A long passphrase like{' '}
            <code className="explainer-code">correct-horse-battery-staple</code> can reach 50+ bits
            of entropy with no uppercase, numbers, or symbols, because its length and randomness
            create a search space too large to brute-force. That's the core insight:{' '}
            <span className="emph-green">length beats complexity</span>.
          </p>

          <h4>Final rating</h4>
          <table className="explainer-table">
            <thead><tr><th>Rating</th><th>Score range</th></tr></thead>
            <tbody>
              {RATING_TABLE.map(([r, range]) => (
                <tr key={r}>
                  <td><span className={`rating-tag rating-${r}`}>{r}</span></td>
                  <td>{range}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            Any password that can be cracked in <span className="emph-red">under 1 hour</span> or is
            found in Have I Been Pwned is automatically rated <span className="emph-red">WEAK</span>{' '}
            regardless of its total score.
          </p>
        </div>
      )}
    </section>
  );
}
