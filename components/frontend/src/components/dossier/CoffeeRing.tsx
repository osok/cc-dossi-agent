import { hashString } from '../../utils/format';

interface CoffeeRingProps {
  seed: string;
}

/**
 * SVG coffee ring watermark positioned deterministically by seed string.
 * Satisfies: FR-DOSSIER-006 (Mission Briefing aesthetic)
 */
export default function CoffeeRing({ seed }: CoffeeRingProps) {
  const hash = hashString(seed);
  const size = 80 + (hash % 40); // 80-120px
  const top = 30 + (hash % 50); // % from top
  const left = 60 + ((hash >> 8) % 30); // % from left

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      style={{
        position: 'absolute',
        top: `${top}%`,
        left: `${left}%`,
        pointerEvents: 'none',
        opacity: 0.08,
      }}
    >
      <circle
        cx="60"
        cy="60"
        r="50"
        fill="none"
        stroke="var(--color-coffee-ring)"
        strokeWidth="10"
        opacity="0.6"
      />
      <circle
        cx="60"
        cy="60"
        r="45"
        fill="none"
        stroke="var(--color-coffee-ring)"
        strokeWidth="3"
        opacity="0.3"
      />
    </svg>
  );
}
