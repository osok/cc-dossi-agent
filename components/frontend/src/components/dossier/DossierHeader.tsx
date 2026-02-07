import type { AgentData } from '@agent-dossier/parser';
import Badge from '../common/Badge';
import PhaseStamp from './PhaseStamp';
import { formatDocId } from '../../utils/format';
import styles from './DossierHeader.module.css';

interface DossierHeaderProps {
  agent: AgentData;
  index: number;
}

/**
 * Dossier header: name, codename, description, badges, phase stamp.
 * Satisfies: FR-DOSSIER-002 to FR-DOSSIER-005, FR-DOSSIER-007, FR-DOSSIER-008
 */
export default function DossierHeader({ agent, index }: DossierHeaderProps) {
  const { frontmatter, enrichment, phase } = agent;

  return (
    <div className={styles.header}>
      <div className={styles.docId}>{formatDocId(index)}</div>

      <h2 className={styles.agentName}>{frontmatter.name}</h2>

      {enrichment?.codename && (
        <div className={styles.codename}>{enrichment.codename}</div>
      )}

      <p className={styles.description}>{frontmatter.description}</p>

      <div className={styles.badges}>
        {frontmatter.tools.map((tool) => (
          <Badge key={tool} label={tool} variant="tool" />
        ))}
        {frontmatter.model && (
          <Badge label={frontmatter.model} variant="model" />
        )}
        {enrichment && (
          <Badge label="AI Enhanced" variant="ai-enhanced" />
        )}
      </div>

      {enrichment?.personality_traits && enrichment.personality_traits.length > 0 && (
        <div className={styles.traits}>
          Traits: {enrichment.personality_traits.join(', ')}
        </div>
      )}

      <div className={styles.phaseArea}>
        <PhaseStamp phase={phase} />
      </div>
    </div>
  );
}
