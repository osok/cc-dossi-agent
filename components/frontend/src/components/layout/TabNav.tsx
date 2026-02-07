import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import { truncate } from '../../utils/format';
import styles from './TabNav.module.css';

/**
 * Tab navigation sidebar for agent dossiers.
 * Satisfies: FR-DOSSIER-001 (tab per agent)
 */
export default function TabNav() {
  const project = useProjectStore((s) => s.project);
  const activeTab = useUIStore((s) => s.activeTab);
  const setActiveTab = useUIStore((s) => s.setActiveTab);

  if (!project) return null;

  return (
    <nav className={styles.tabNav} role="tablist" aria-label="Agent tabs">
      <div className={styles.agentTabs}>
        {project.agents.map((agent) => (
          <button
            key={agent.id}
            className={`${styles.tab} ${
              activeTab === agent.id ? styles.active : ''
            }`}
            role="tab"
            aria-selected={activeTab === agent.id}
            onClick={() => setActiveTab(agent.id)}
            title={agent.frontmatter.name}
          >
            <span className={styles.tabName}>
              {truncate(agent.enrichment?.codename || agent.frontmatter.name, 20)}
            </span>
            {agent.enrichment && (
              <span className={styles.enrichedDot} title="AI Enhanced" />
            )}
          </button>
        ))}
      </div>
    </nav>
  );
}
