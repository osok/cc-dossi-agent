import type { AgentData, WorkflowPhase } from '@agent-dossier/parser';
import AgentCard from './AgentCard';

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
  requirements: 'Requirements',
  architecture: 'Architecture',
  design: 'Design',
  implementation: 'Implementation',
  review: 'Review',
  testing: 'Testing',
  documentation: 'Documentation',
  unassigned: 'Unassigned',
};

interface PhaseColumnProps {
  phase: WorkflowPhase;
  agents: AgentData[];
}

/**
 * Single phase column in the pipeline view.
 * Satisfies: FR-PIPE-002 (phase columns)
 */
export default function PhaseColumn({ phase, agents }: PhaseColumnProps) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minWidth: '160px',
      maxWidth: '220px',
      flex: 1,
    }}>
      <div style={{
        fontFamily: 'var(--font-typewriter)',
        fontSize: 'var(--text-xs)',
        fontWeight: 'bold',
        color: 'white',
        background: PHASE_COLORS[phase],
        padding: 'var(--space-1) var(--space-3)',
        borderRadius: 'var(--radius-sm) var(--radius-sm) 0 0',
        textAlign: 'center',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}>
        {PHASE_LABELS[phase]}
        <span style={{
          marginLeft: 'var(--space-2)',
          opacity: 0.7,
          fontSize: '10px',
        }}>
          ({agents.length})
        </span>
      </div>

      <div style={{
        flex: 1,
        background: 'var(--color-paper-base)',
        border: '1px solid var(--color-paper-edge)',
        borderTop: 'none',
        borderRadius: '0 0 var(--radius-sm) var(--radius-sm)',
        padding: 'var(--space-2)',
        minHeight: '100px',
      }}>
        {agents.length === 0 ? (
          <div style={{
            fontFamily: 'var(--font-typewriter)',
            fontSize: 'var(--text-xs)',
            color: 'var(--color-ink-faded)',
            textAlign: 'center',
            padding: 'var(--space-4)',
            opacity: 0.5,
          }}>
            No agents
          </div>
        ) : (
          agents.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))
        )}
      </div>
    </div>
  );
}
