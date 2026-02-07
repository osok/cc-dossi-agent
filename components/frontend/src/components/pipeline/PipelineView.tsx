import { useMemo } from 'react';
import type { AgentData, WorkflowPhase } from '@agent-dossier/parser';
import PhaseColumn from './PhaseColumn';
import styles from './PipelineView.module.css';

const PHASE_ORDER: WorkflowPhase[] = [
  'requirements',
  'architecture',
  'design',
  'implementation',
  'review',
  'testing',
  'documentation',
  'unassigned',
];

interface PipelineViewProps {
  agents: AgentData[];
}

/**
 * Pipeline view: phase columns with agent cards.
 * Satisfies: FR-PIPE-001 to FR-PIPE-007
 */
export default function PipelineView({ agents }: PipelineViewProps) {
  // Group agents by phase
  const phaseGroups = useMemo(() => {
    const groups: Record<WorkflowPhase, AgentData[]> = {
      requirements: [],
      architecture: [],
      design: [],
      implementation: [],
      review: [],
      testing: [],
      documentation: [],
      unassigned: [],
    };

    for (const agent of agents) {
      const phase = agent.phase || 'unassigned';
      if (groups[phase]) {
        groups[phase].push(agent);
      } else {
        groups.unassigned.push(agent);
      }
    }

    return groups;
  }, [agents]);

  // Filter out empty phases except unassigned (always show it if there are agents)
  const visiblePhases = PHASE_ORDER.filter(
    (phase) => phaseGroups[phase].length > 0 || phase === 'unassigned'
  );

  return (
    <div className={styles.pipelineContainer}>
      <h2 className={styles.title}>Agent Pipeline</h2>
      <div className={styles.columns}>
        {visiblePhases.map((phase, index) => (
          <div key={phase} style={{ display: 'flex', alignItems: 'stretch' }}>
            <PhaseColumn phase={phase} agents={phaseGroups[phase]} />
            {index < visiblePhases.length - 1 && (
              <div className={styles.arrow}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12h14m-7-7l7 7-7 7" stroke="var(--color-paper-edge)" strokeWidth="2" />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
