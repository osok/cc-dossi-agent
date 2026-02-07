import Button from '../common/Button';
import styles from './PortraitDisplay.module.css';

interface PortraitPlaceholderProps {
  agentName: string;
  onGenerate: () => void;
  loading: boolean;
  size?: number;
}

/**
 * Silhouette placeholder when no portrait exists yet.
 * Satisfies: FR-IMG-002 (placeholder), FR-IMG-005 (generate trigger)
 */
export default function PortraitPlaceholder({
  agentName,
  onGenerate,
  loading,
  size = 200,
}: PortraitPlaceholderProps) {
  return (
    <div
      className={styles.container}
      style={{
        width: size,
        height: size,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-3)',
      }}
    >
      {/* Silhouette SVG */}
      <svg
        width="60"
        height="60"
        viewBox="0 0 80 80"
        fill="none"
        style={{ opacity: 0.3 }}
      >
        <circle cx="40" cy="28" r="16" fill="var(--color-ink-faded)" />
        <ellipse cx="40" cy="62" rx="24" ry="16" fill="var(--color-ink-faded)" />
      </svg>

      <span style={{
        fontFamily: 'var(--font-typewriter)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-ink-faded)',
        textAlign: 'center',
        padding: '0 var(--space-2)',
      }}>
        {agentName}
      </span>

      <Button
        variant="primary"
        size="small"
        onClick={onGenerate}
        loading={loading}
      >
        Generate
      </Button>
    </div>
  );
}
