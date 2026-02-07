import styles from './DossierPage.module.css';

interface FolderTabProps {
  label: string;
}

/**
 * Manila folder tab at top of dossier card.
 * Satisfies: FR-DOSSIER-006 (Mission Briefing aesthetic)
 */
export default function FolderTab({ label }: FolderTabProps) {
  return (
    <div className={styles.folderTab}>
      {label}
    </div>
  );
}
