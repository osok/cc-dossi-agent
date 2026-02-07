import type { WorkflowPhase } from '@agent-dossier/parser';
import styles from './DossierPage.module.css';

const PHASE_COLORS: Record<WorkflowPhase, string> = {
  requirements: 'var(--color-phase-requirements)',
  architecture: 'var(--color-phase-architecture)',
  design: 'var(--color-phase-design)',
  implementation: 'var(--color-phase-implementation)',
  review: 'var(--color-phase-review)',
  testing: 'var(--color-phase-testing)',
  documentation: 'var(--color-phase-documentation)',
  unassigned: 'var(--color-ink-faded)',
};

const PHASE_LABELS: Record<WorkflowPhase, string> = {
  requirements: 'REQUIREMENTS',
  architecture: 'ARCHITECTURE',
  design: 'DESIGN OPS',
  implementation: 'IMPLEMENTATION',
  review: 'REVIEW OPS',
  testing: 'TESTING',
  documentation: 'DOCUMENTATION',
  unassigned: 'UNASSIGNED',
};

interface PhaseStampProps {
  phase: WorkflowPhase;
}

/**
 * Phase badge stamp.
 * Satisfies: FR-PIPE-003 (phase classification display)
 */
export default function PhaseStamp({ phase }: PhaseStampProps) {
  return (
    <span
      className={styles.phaseStamp}
      style={{ backgroundColor: PHASE_COLORS[phase] }}
    >
      {PHASE_LABELS[phase]}
    </span>
  );
}
