import styles from './Badge.module.css';

interface BadgeProps {
  label: string;
  variant?: 'tool' | 'model' | 'ai-enhanced' | 'phase';
  phaseColor?: string;
}

/**
 * Themed badge component for tools, models, AI-enhanced markers, and phases.
 * Satisfies: FR-DOSSIER-007 (tool badges), FR-DOSSIER-008 (model badge)
 */
export default function Badge({ label, variant = 'tool', phaseColor }: BadgeProps) {
  const classNames = [styles.badge, styles[variant]].join(' ');

  return (
    <span
      className={classNames}
      style={phaseColor ? { backgroundColor: phaseColor } : undefined}
    >
      {variant === 'ai-enhanced' && <span className={styles.sparkle}>*</span>}
      {label}
    </span>
  );
}
