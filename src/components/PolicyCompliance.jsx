// Old-school corporate policy vs NIST SP 800-63B. Mirrors render_policy_compliance.

function Cell({ passed, label, na }) {
  if (na) {
    return (
      <div className="policy-cell">
        <span className="badge badge-na">[N/A]</span>
        <div className="policy-sub">{label}</div>
      </div>
    );
  }
  return (
    <div className="policy-cell">
      <span className={`badge ${passed ? 'badge-pass' : 'badge-fail'}`}>
        {passed ? '[PASS]' : '[FAIL]'}
      </span>
      <div className="policy-sub">{label}</div>
    </div>
  );
}

export function PolicyCompliance({ result }) {
  if (!result) return null;
  const c = result.compliance;
  const len = result.length;

  const csPass   = c.cs_length && c.cs_complexity;
  const nistPass = c.nist_length && c.nist_breach;

  let summary, summaryTier;
  if (csPass && nistPass) {
    summary = 'This password meets both standards.';
    summaryTier = 'good';
  } else if (nistPass && !csPass) {
    summary = 'This password would be rejected by a typical corporate policy but is fully ' +
      'compliant with NIST SP 800-63B, and significantly harder to crack.';
    summaryTier = 'mid';
  } else if (csPass && !nistPass) {
    summary = 'This password meets old-school corporate requirements but does not meet ' +
      'current NIST guidance.';
    summaryTier = 'mid';
  } else {
    summary = 'This password fails both standards.';
    summaryTier = 'bad';
  }

  const rows = [
    {
      criterion: 'Minimum length',
      corp: <Cell passed={c.cs_length} label={`requires 8+, has ${len}`} />,
      nist: <Cell passed={c.nist_length} label={`recommends 15+, has ${len}`} />,
    },
    {
      criterion: 'Character complexity',
      corp: <Cell passed={c.cs_complexity}
                  label={c.cs_complexity ? 'upper, lower, digit, special' : 'requires upper, lower, digit, special'} />,
      nist: <Cell passed label="not required" />,
    },
    {
      criterion: 'Breach database check',
      corp: <Cell na label="not performed" />,
      nist: <Cell passed={c.nist_breach} label={c.nist_breach ? 'not found in HIBP' : 'found in HIBP'} />,
    },
    {
      criterion: 'Forced rotation',
      corp: <Cell na label="typically every 90 days" />,
      nist: <Cell passed label="not recommended" />,
    },
  ];

  return (
    <section className="policy-compliance panel">
      <div className="panel-head">
        <span className="panel-title">Policy compliance</span>
      </div>

      <div className="policy-grid">
        <div className="policy-row policy-header">
          <div className="policy-colhead" />
          <div className="policy-colhead">Old-school corporate</div>
          <div className="policy-colhead policy-colhead-nist">NIST SP 800-63B</div>
        </div>

        {rows.map(r => (
          <div key={r.criterion} className="policy-row">
            <div className="policy-criterion">{r.criterion}</div>
            {r.corp}
            {r.nist}
          </div>
        ))}
      </div>

      <div className={`panel-foot tier-${summaryTier}`}>{summary}</div>
    </section>
  );
}
