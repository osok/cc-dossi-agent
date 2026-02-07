import Button from '../common/Button';
import styles from './DossierFooter.module.css';

interface DossierFooterProps {
  isEnriched: boolean;
  onEnrich: () => void;
  onExportPdf: () => void;
  onGeneratePortrait: () => void;
  enrichLoading: boolean;
  portraitLoading: boolean;
  pdfLoading: boolean;
}

/**
 * Action buttons at the bottom of a dossier page.
 * Satisfies: FR-ENRICH-001 (trigger enrichment), FR-PDF-001 (export), FR-IMG-005 (generate)
 */
export default function DossierFooter({
  isEnriched,
  onEnrich,
  onExportPdf,
  onGeneratePortrait,
  enrichLoading,
  portraitLoading,
  pdfLoading,
}: DossierFooterProps) {
  return (
    <div className={styles.footer}>
      <Button
        variant="primary"
        onClick={onEnrich}
        loading={enrichLoading}
        disabled={isEnriched}
      >
        {isEnriched ? 'AI Enhanced' : 'Enrich with AI'}
      </Button>

      <Button
        variant="secondary"
        onClick={onGeneratePortrait}
        loading={portraitLoading}
      >
        Generate Portrait
      </Button>

      <Button
        variant="secondary"
        onClick={onExportPdf}
        loading={pdfLoading}
      >
        Export PDF
      </Button>
    </div>
  );
}
