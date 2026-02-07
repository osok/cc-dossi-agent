import type { AgentData } from '@agent-dossier/parser';
import { truncate } from '../../utils/format';
import { useUIStore } from '../../stores/uiStore';

interface AgentCardProps {
  agent: AgentData;
}

/**
 * Agent card within a pipeline phase column.
 * Satisfies: FR-PIPE-004 (agent card), FR-PIPE-005 (click navigation)
 */
export default function AgentCard({ agent }: AgentCardProps) {
  const setActiveTab = useUIStore((s) => s.setActiveTab);

  return (
    <button
      onClick={() => setActiveTab(agent.id)}
      style={{
        display: 'block',
        width: '100%',
        padding: 'var(--space-2) var(--space-3)',
        background: 'var(--color-paper-light)',
        border: '1px solid var(--color-paper-edge)',
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'box-shadow var(--transition-fast)',
        marginBottom: 'var(--space-2)',
      }}
    >
      <div style={{
        fontFamily: 'var(--font-typewriter)',
        fontSize: 'var(--text-sm)',
        color: 'var(--color-ink-black)',
      }}>
        {truncate(agent.frontmatter.name, 24)}
      </div>
      {agent.enrichment?.codename && (
        <div style={{
          fontFamily: 'var(--font-typewriter)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-classified)',
        }}>
          {agent.enrichment.codename}
        </div>
      )}
      <div style={{
        fontFamily: 'var(--font-body)',
        fontSize: 'var(--text-xs)',
        color: 'var(--color-ink-faded)',
        marginTop: 'var(--space-1)',
      }}>
        {truncate(agent.frontmatter.description, 60)}
      </div>
    </button>
  );
}
