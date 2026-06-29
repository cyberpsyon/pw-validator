// The ensō completes as score climbs from 0 to 100.
// CIRCUMFERENCE = 2 * π * r = 2 * π * 90 ≈ 565.5
const CIRCUMFERENCE = 565.5;

export function EnsoCircle({ score, rating }) {
  const ratingColor = {
    EXCELLENT: '#3DDC97',
    STRONG:    '#3DDC97',
    GOOD:      '#FFB020',
    FAIR:      '#FFB020',
    WEAK:      '#FF5577',
  }[rating] ?? 'var(--text-faint)';

  const dashOffset = CIRCUMFERENCE * (1 - (score ?? 0) / 100);

  return (
    <svg viewBox="0 0 260 260" width="260" height="260">
      <defs>
        <filter id="enso-texture">
          <feTurbulence type="fractalNoise" baseFrequency="0.04"
            numOctaves="4" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise"
            scale="2.5" xChannelSelector="R" yChannelSelector="G"/>
        </filter>
      </defs>
      {/* Ghost ring */}
      <circle cx="130" cy="130" r="90" fill="none"
        stroke="var(--surface2)" strokeWidth="32"/>
      {/* Ensō stroke */}
      <circle cx="130" cy="130" r="90" fill="none"
        stroke={ratingColor}
        strokeWidth="28"
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={dashOffset}
        filter="url(#enso-texture)"
        transform="rotate(-90 130 130)"
        style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(0.25,0.1,0.25,1), stroke 0.6s ease' }}
      />
      {/* Score label */}
      <text x="130" y="122" textAnchor="middle"
        fontFamily="'Inter', sans-serif"
        fontSize="44" fill="var(--text)" fontWeight="700">
        {score ?? '—'}
      </text>
      <text x="130" y="148" textAnchor="middle"
        fontFamily="'JetBrains Mono', monospace"
        fontSize="10" fill={ratingColor} letterSpacing="4">
        {rating ?? 'AWAITING'}
      </text>
    </svg>
  );
}
