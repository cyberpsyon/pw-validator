// Segmented crack-time gauge. Thresholds & labels mirror _GAUGE_SEGMENTS.
// Colors adapted to the ensō palette (real app: red/orange/yellow/green/teal).
const SEGMENTS = [
  { threshold: 0,          label: 'Instant',   color: 'var(--red)' },
  { threshold: 60,         label: 'Minutes',   color: 'var(--red)' },
  { threshold: 3600,       label: 'Hours',     color: 'var(--orange)' },
  { threshold: 86400,      label: 'Days',      color: 'var(--orange)' },
  { threshold: 2592000,    label: 'Months',    color: 'var(--yellow)' },
  { threshold: 31536000,   label: 'Years',     color: 'var(--yellow)' },
  { threshold: 315360000,  label: 'Decades',   color: 'var(--green)' },
  { threshold: 3153600000, label: 'Centuries', color: 'var(--teal)' },
];

function segmentIndex(crackSeconds) {
  for (let i = 0; i < SEGMENTS.length; i++) {
    if (i + 1 < SEGMENTS.length && crackSeconds < SEGMENTS[i + 1].threshold) return i;
  }
  return SEGMENTS.length - 1;
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';
}

export function ThreatGauge({ crackSeconds, crackTime }) {
  const active = segmentIndex(crackSeconds);
  const tierColor = SEGMENTS[active].color;

  return (
    <section className="threat-gauge">
      <div className="gauge-head">
        <span className="gauge-title">Estimated crack time</span>
        <span className="gauge-display" style={{ color: tierColor }}>
          {capitalize(crackTime)}
        </span>
      </div>

      <div className="gauge-track" key={active}>
        {SEGMENTS.map((seg, i) => (
          <div
            key={seg.label}
            className="gauge-seg"
            title={seg.label}
            style={{ background: seg.color, opacity: i <= active ? 1 : 0.11, '--seg-i': i }}
          />
        ))}
      </div>

      <div className="gauge-ends">
        <span className="gauge-end">← Instant</span>
        <span className="gauge-end">Centuries →</span>
      </div>
    </section>
  );
}
