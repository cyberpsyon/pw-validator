export function AttackBreakdown({ sequence }) {
  if (!sequence) return null;
  const nonBrute = sequence.filter(s => s.tag !== 'BRUTE');

  return (
    <section className="attack-breakdown panel">
      <div className="panel-head">
        <span className="panel-title">How an attacker would crack this</span>
      </div>

      {nonBrute.length === 0 ? (
        <div className="attack-clean">
          ✓ No exploitable patterns detected. Attacker falls back to pure brute force.
        </div>
      ) : (
        <div className="attack-list">
          {nonBrute.map((item, i) => (
            <div key={i} className="attack-row">
              <span className={`attack-tag severity-${item.severity}`}>[{item.tag}]</span>
              <span className="attack-token">&quot;{item.token}&quot;</span>
              <span className="attack-desc">{item.description}</span>
            </div>
          ))}
        </div>
      )}

      <div className="panel-foot">
        {nonBrute.length === 0
          ? 'Without a recognizable pattern, cracking requires testing every possible combination.'
          : 'Attackers use automated tools that try dictionary words, dates, and keyboard patterns before brute force.'}
      </div>
    </section>
  );
}
