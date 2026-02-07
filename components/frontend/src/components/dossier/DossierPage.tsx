import type { AgentData } from '@agent-dossier/parser';
import ClassifiedStamp from './ClassifiedStamp';
import FolderTab from './FolderTab';
import CoffeeRing from './CoffeeRing';
import DossierHeader from './DossierHeader';
import DossierSections from './DossierSections';
import DossierFooter from './DossierFooter';
import styles from './DossierPage.module.css';

interface DossierPageProps {
  agent: AgentData;
  index: number;
  onEnrich: () => void;
  onExportPdf: () => void;
  onGeneratePortrait: () => void;
  enrichLoading: boolean;
  portraitLoading: boolean;
  pdfLoading: boolean;
  /** Portrait display component passed as child (T016) */
  portraitSlot?: React.ReactNode;
  /** Stat card component passed as child (T017) */
  statSlot?: React.ReactNode;
}

/**
 * Full dossier view for a single agent.
 * Two-column layout above fold (header + portrait), full-width sections below.
 * Satisfies: FR-DOSSIER-001 to FR-DOSSIER-013
 */
export default function DossierPage({
  agent,
  index,
  onEnrich,
  onExportPdf,
  onGeneratePortrait,
  enrichLoading,
  portraitLoading,
  pdfLoading,
  portraitSlot,
  statSlot,
}: DossierPageProps) {
  return (
    <div className={styles.dossierPage}>
      <CoffeeRing seed={agent.frontmatter.name} />

      <ClassifiedStamp />

      <FolderTab label={agent.frontmatter.name} />

      <div className={styles.dossierCard}>
        {/* Two-column header area */}
        <div className={styles.headerArea}>
          <div className={styles.headerLeft}>
            <DossierHeader agent={agent} index={index} />
          </div>
          <div className={styles.headerRight}>
            {portraitSlot && (
              <div className={styles.portraitArea}>
                {portraitSlot}
              </div>
            )}
            {statSlot && (
              <div className={styles.statArea}>
                {statSlot}
              </div>
            )}
          </div>
        </div>

        {/* Full-width sections */}
        <DossierSections agent={agent} />

        {/* Action buttons */}
        <DossierFooter
          isEnriched={!!agent.enrichment}
          onEnrich={onEnrich}
          onExportPdf={onExportPdf}
          onGeneratePortrait={onGeneratePortrait}
          enrichLoading={enrichLoading}
          portraitLoading={portraitLoading}
          pdfLoading={pdfLoading}
        />
      </div>
    </div>
  );
}
