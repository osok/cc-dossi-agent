import { IMAGE_MODELS } from '@agent-dossier/parser';
import type { ImageModel } from '@agent-dossier/parser';

const modelKeys = Object.keys(IMAGE_MODELS) as ImageModel[];

interface ImageModelSelectorProps {
  value: ImageModel;
  onChange: (model: ImageModel) => void;
}

/**
 * Image generation model dropdown selector.
 */
export default function ImageModelSelector({ value, onChange }: ImageModelSelectorProps) {
  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <label style={{
        display: 'block',
        fontFamily: 'var(--font-typewriter)',
        fontSize: 'var(--text-sm)',
        color: 'var(--color-ink-black)',
        marginBottom: 'var(--space-1)',
      }}>
        Image Generation Model
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ImageModel)}
        style={{
          width: '100%',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-sm)',
          padding: 'var(--space-2)',
          border: '1px solid var(--color-paper-edge)',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--color-paper-base)',
          color: 'var(--color-ink-black)',
          cursor: 'pointer',
        }}
      >
        {modelKeys.map((key) => (
          <option key={key} value={key}>
            {IMAGE_MODELS[key].displayName}
          </option>
        ))}
      </select>
    </div>
  );
}
