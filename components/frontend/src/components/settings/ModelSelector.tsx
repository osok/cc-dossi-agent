import { CLAUDE_MODELS } from '@agent-dossier/parser';
import type { ClaudeModel } from '@agent-dossier/parser';

const modelKeys = Object.keys(CLAUDE_MODELS) as ClaudeModel[];

interface ModelSelectorProps {
  value: ClaudeModel;
  onChange: (model: ClaudeModel) => void;
}

/**
 * Claude model dropdown selector.
 * Satisfies: FR-CFG-003 (model selection)
 */
export default function ModelSelector({ value, onChange }: ModelSelectorProps) {
  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <label style={{
        display: 'block',
        fontFamily: 'var(--font-typewriter)',
        fontSize: 'var(--text-sm)',
        color: 'var(--color-ink-black)',
        marginBottom: 'var(--space-1)',
      }}>
        Claude Model
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ClaudeModel)}
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
            {CLAUDE_MODELS[key].displayName}
          </option>
        ))}
      </select>
    </div>
  );
}
