import { PORTRAIT_STYLES } from '@agent-dossier/parser';
import type { PortraitStyle } from '@agent-dossier/parser';
import styles from './StyleSelector.module.css';

const styleKeys = Object.keys(PORTRAIT_STYLES) as PortraitStyle[];

interface StyleSelectorProps {
  selectedStyle: PortraitStyle;
  onSelect: (style: PortraitStyle) => void;
  /** Map of style -> portrait URL for showing which styles have cached portraits */
  availableStyles?: Partial<Record<PortraitStyle, string>>;
}

/**
 * 8-style thumbnail grid selector for portrait styles.
 * Satisfies: FR-IMG-011 (style selector), FR-IMG-001 (8 art styles)
 */
export default function StyleSelector({
  selectedStyle,
  onSelect,
  availableStyles = {},
}: StyleSelectorProps) {
  return (
    <div className={styles.grid}>
      {styleKeys.map((key) => {
        const hasPortrait = !!availableStyles[key];
        const isSelected = selectedStyle === key;

        return (
          <button
            key={key}
            className={`${styles.styleOption} ${isSelected ? styles.selected : ''} ${hasPortrait ? styles.hasPortrait : ''}`}
            onClick={() => onSelect(key)}
            title={PORTRAIT_STYLES[key].displayName}
          >
            <span className={styles.styleName}>
              {PORTRAIT_STYLES[key].displayName}
            </span>
            {hasPortrait && <span className={styles.dot} />}
          </button>
        );
      })}
    </div>
  );
}
