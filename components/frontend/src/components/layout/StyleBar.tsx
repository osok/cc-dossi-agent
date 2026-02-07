import { useSettingsStore } from '../../stores/settingsStore';
import { useProjectStore } from '../../stores/projectStore';
import { PORTRAIT_STYLES } from '@agent-dossier/parser';
import type { PortraitStyle } from '@agent-dossier/parser';
import styles from './StyleBar.module.css';

const styleKeys = Object.keys(PORTRAIT_STYLES) as PortraitStyle[];

interface StyleBarProps {
  onBatchPortraits: () => void;
  onBatchAllStyles: () => void;
  onBatchEnrich: () => void;
  onReparse: () => void;
  batchLoading: boolean;
}

/**
 * Portrait style selector bar with batch action buttons.
 * Satisfies: FR-IMG-001, FR-IMG-002, FR-IMG-010, FR-IMG-011
 */
export default function StyleBar({
  onBatchPortraits,
  onBatchAllStyles,
  onBatchEnrich,
  onReparse,
  batchLoading,
}: StyleBarProps) {
  const selectedStyle = useSettingsStore((s) => s.selectedStyle);
  const setStyle = useSettingsStore((s) => s.setStyle);
  const project = useProjectStore((s) => s.project);

  if (!project) return null;

  const hasAgents = project.agents.length > 0;

  return (
    <div className={styles.styleBar}>
      <div className={styles.styleList}>
        <span className={styles.label}>Style:</span>
        {styleKeys.map((key) => (
          <button
            key={key}
            className={`${styles.styleButton} ${
              selectedStyle === key ? styles.active : ''
            }`}
            onClick={() => setStyle(key)}
            title={PORTRAIT_STYLES[key].displayName}
          >
            {PORTRAIT_STYLES[key].displayName}
          </button>
        ))}
      </div>

      <div className={styles.actions}>
        <button
          className={styles.batchButton}
          disabled={!hasAgents || batchLoading}
          onClick={onBatchPortraits}
          title="Generate portraits for all agents in the selected style"
        >
          Generate All Portraits
        </button>
        <button
          className={styles.batchButton}
          disabled={!hasAgents || batchLoading}
          onClick={onBatchAllStyles}
          title="Generate portraits for all agents in every style"
        >
          Generate All Styles
        </button>
        <button
          className={styles.batchButton}
          disabled={!hasAgents || batchLoading}
          onClick={onBatchEnrich}
          title="Enrich all agents with AI analysis"
        >
          Enrich All
        </button>
        <button
          className={styles.batchButton}
          disabled={!hasAgents || batchLoading}
          onClick={onReparse}
          title="Re-parse all agents from their markdown source"
        >
          Re-parse All
        </button>
      </div>
    </div>
  );
}
