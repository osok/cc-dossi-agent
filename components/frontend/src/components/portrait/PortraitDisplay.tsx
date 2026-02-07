import styles from './PortraitDisplay.module.css';

interface PortraitDisplayProps {
  /** URL to the portrait image */
  imageUrl: string;
  /** Agent name for alt text */
  agentName: string;
  /** Size in pixels (default 200) */
  size?: number;
  /** Callback to regenerate the portrait */
  onRegenerate?: () => void;
  /** Whether regeneration is in progress */
  regenerating?: boolean;
}

/**
 * Portrait image display with paper clip, rotation, and Polaroid treatment.
 * Satisfies: FR-IMG-001 (display), FR-IMG-010 (rotation), FR-DOSSIER-006 (aesthetic)
 */
export default function PortraitDisplay({
  imageUrl,
  agentName,
  size = 200,
  onRegenerate,
  regenerating = false,
}: PortraitDisplayProps) {
  return (
    <div className={styles.container} style={{ width: size, height: size }}>
      {/* Paper clip SVG at top-right */}
      <svg
        className={styles.paperClip}
        width="24"
        height="48"
        viewBox="0 0 24 48"
        fill="none"
        stroke="#888"
        strokeWidth="1.5"
      >
        <path d="M6 2 C6 2, 2 2, 2 8 L2 36 C2 42, 8 46, 12 46 C16 46, 22 42, 22 36 L22 12 C22 6, 16 4, 12 4 C8 4, 6 6, 6 12 L6 32" />
      </svg>

      <img
        src={imageUrl}
        alt={`Portrait of ${agentName}`}
        className={styles.image}
      />

      {onRegenerate && (
        <button
          className={styles.regenerateBtn}
          onClick={onRegenerate}
          disabled={regenerating}
          title="Regenerate portrait"
        >
          {regenerating ? '...' : '\u21BB'}
        </button>
      )}
    </div>
  );
}
