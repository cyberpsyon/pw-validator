// Mirrors the recommendations block in render_validation_results.
export function Recommendations({ result }) {
  if (!result) return null;

  const recs = [];
  if (result.score < 50) recs.push('This password is too weak for secure systems.');
  if (result.failed.length) recs.push('Address all failed rules listed above.');
  if (result.failed.some(r => /have i been pwned/i.test(r))) {
    recs.push('Use a unique password not found in the Have I Been Pwned database.');
  }
  if (result.warning) recs.push(result.warning);
  if (result.suggestions) recs.push(...result.suggestions);

  if (recs.length === 0) return null;

  return (
    <section className="recommendations panel panel-accent">
      <div className="panel-head">
        <span className="panel-title panel-title-accent">Recommendations</span>
      </div>
      <div className="rec-list">
        {recs.map((rec, i) => (
          <div key={i} className="rec-row">
            <span className="rec-arrow">→</span>
            <span className="rec-text">{rec}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
