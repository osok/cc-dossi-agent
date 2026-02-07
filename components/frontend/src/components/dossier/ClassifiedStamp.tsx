import styles from './DossierPage.module.css';

/**
 * "CLASSIFIED - AGENT DOSSIER" stamp overlay.
 * Satisfies: FR-DOSSIER-006 (Mission Briefing aesthetic)
 */
export default function ClassifiedStamp() {
  return (
    <div className={styles.classifiedStamp}>
      CLASSIFIED - AGENT DOSSIER
    </div>
  );
}
