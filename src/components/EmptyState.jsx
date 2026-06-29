const EXAMPLES = [
  { label: 'password123', value: 'password123' },
  { label: 'a passphrase', value: 'correct-horse-battery-staple' },
  { label: 'a strong one', value: 'Xy7!Qw9@Lm3#Zt5%Vb' },
];

export function EmptyState({ onPick }) {
  return (
    <div className="empty-state">
      <svg className="ghost-enso" viewBox="0 0 260 260" width="220" height="220" aria-hidden="true">
        <circle cx="130" cy="130" r="90" fill="none"
          stroke="var(--text-faint)" strokeWidth="26" strokeLinecap="round"
          strokeDasharray="540 25" transform="rotate(-90 130 130)" />
      </svg>
      <p className="empty-invite">Type a password to see it come alive.</p>
      <div className="empty-examples">
        <span className="empty-examples-label">Try an example:</span>
        {EXAMPLES.map(ex => (
          <button key={ex.value} type="button" className="example-chip" onClick={() => onPick(ex.value)}>
            {ex.label}
          </button>
        ))}
      </div>
    </div>
  );
}
