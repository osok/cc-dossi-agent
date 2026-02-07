import { useProjectStore } from '../../stores/projectStore';
import { useUIStore } from '../../stores/uiStore';
import styles from './TopBar.module.css';

/**
 * Top navigation bar with app logo, project name, view tabs, and global actions.
 * Satisfies: FR-DOSSIER-006 layout, FR-PROJ-001 (project name display),
 *            FR-REL-001 (map tab), FR-PIPE-001 (pipeline tab)
 */
export default function TopBar() {
  const project = useProjectStore((s) => s.project);
  const activeTab = useUIStore((s) => s.activeTab);
  const setActiveTab = useUIStore((s) => s.setActiveTab);
  const openProjectDialog = useUIStore((s) => s.openProjectDialog);
  const openSettings = useUIStore((s) => s.openSettings);

  return (
    <header className={styles.topBar}>
      <div className={styles.left}>
        <h1 className={styles.logo}>Agent Dossier</h1>
        {project && (
          <span className={styles.projectName}>{project.name}</span>
        )}
      </div>

      <div className={styles.right}>
        {project && project.agents.length > 0 && (
          <div className={styles.viewTabs}>
            <button
              className={`${styles.viewTab} ${activeTab === 'relationship-map' ? styles.viewTabActive : ''}`}
              onClick={() => setActiveTab('relationship-map')}
              title="Relationship map view"
            >
              Map
            </button>
            <button
              className={`${styles.viewTab} ${activeTab === 'pipeline' ? styles.viewTabActive : ''}`}
              onClick={() => setActiveTab('pipeline')}
              title="Pipeline view"
            >
              Pipeline
            </button>
          </div>
        )}

        <div className={styles.actions}>
          <button
            className={styles.actionButton}
            onClick={openProjectDialog}
            title="Project management"
          >
            Projects
          </button>
          <button
            className={styles.actionButton}
            onClick={openSettings}
            title="Settings"
          >
            Settings
          </button>
        </div>
      </div>
    </header>
  );
}
