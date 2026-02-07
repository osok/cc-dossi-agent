interface ProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

/**
 * Batch operation progress bar.
 * Satisfies: FR-IMG-007 (progress indicator), FR-ENRICH-009
 */
export default function ProgressBar({ current, total, label }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div style={{
      padding: 'var(--space-2) var(--space-4)',
      fontFamily: 'var(--font-typewriter)',
      fontSize: 'var(--text-sm)',
    }}>
      {label && <p style={{ marginBottom: 'var(--space-1)', color: 'var(--color-ink-faded)' }}>{label}</p>}
      <div style={{
        width: '100%',
        height: '8px',
        background: 'var(--color-paper-light)',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--color-paper-edge)',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${percentage}%`,
          height: '100%',
          background: 'var(--color-paper-dark)',
          transition: 'width var(--transition-normal)',
        }} />
      </div>
      <p style={{
        marginTop: 'var(--space-1)',
        color: 'var(--color-ink-faded)',
        fontSize: 'var(--text-xs)',
        textAlign: 'right',
      }}>
        {current} / {total} ({percentage}%)
      </p>
    </div>
  );
}
