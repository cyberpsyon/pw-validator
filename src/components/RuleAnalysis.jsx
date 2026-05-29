// Failed entries carry a leading marker that determines their badge:
//   ✗ (✗) -> [FAIL]   ⚠ (⚠) -> [WARN]   ○ (○) -> [OPT]
function badgeFor(rule) {
  if (rule.startsWith('⚠')) return { cls: 'warn', text: '[WARN]' };
  if (rule.startsWith('○')) return { cls: 'opt',  text: '[OPT]' };
  return { cls: 'fail', text: '[FAIL]' };
}

export function RuleAnalysis({ result, phase }) {
  if (!result) return null;
  const passed = result.passed;
  const failed = result.failed;
  const checking = phase === 'checking' || result.hibpPending;

  const optCount  = failed.filter(r => r.startsWith('○')).length;
  const failCount = failed.length - optCount;

  return (
    <section className="rule-analysis panel">
      <div className="panel-head">
        <span className="panel-title">Rule analysis</span>
        <div className="rule-counts">
          <span className="c-pass">✓ {passed.length} passed</span>
          <span className="c-fail">✗ {failCount} failed</span>
          <span className="c-opt">○ {optCount} optional</span>
        </div>
      </div>

      <div className="rule-list">
        {passed.map((rule, i) => (
          <div key={`p${i}`} className="rule-row">
            <span className="badge badge-ok">[OK]</span>
            <span className="rule-text">{rule}</span>
          </div>
        ))}

        {checking && (
          <div className="rule-row">
            <span className="badge badge-pending">[····]</span>
            <span className="rule-text rule-pending">Checking Have I Been Pwned breach database…</span>
          </div>
        )}

        {failed.map((rule, i) => {
          const b = badgeFor(rule);
          const isBreach = /have i been pwned/i.test(rule);
          return (
            <div key={`f${i}`}>
              <div className="rule-row">
                <span className={`badge badge-${b.cls}`}>{b.text}</span>
                <span className="rule-text">{rule}</span>
              </div>
              {isBreach && result.hibpCount != null && (
                <div className="rule-context">
                  Passwords in breach databases are loaded into automated credential stuffing
                  tools and tried against millions of accounts. A count of{' '}
                  {result.hibpCount.toLocaleString()} means this exact password has been seen
                  that many times in real-world breaches.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
