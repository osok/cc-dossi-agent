import { useState } from 'react';

interface ApiKeyInputProps {
  label: string;
  value: string | null;
  onChange: (key: string) => void;
  placeholder?: string;
}

/**
 * Masked API key input field.
 * Satisfies: FR-CFG-001, FR-CFG-002 (API key entry)
 */
export default function ApiKeyInput({
  label,
  value,
  onChange,
  placeholder,
}: ApiKeyInputProps) {
  const [visible, setVisible] = useState(false);

  const displayValue = value || '';
  const maskedValue = displayValue.length > 8
    ? displayValue.substring(0, 4) + '...' + displayValue.substring(displayValue.length - 4)
    : displayValue;

  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      <label style={{
        display: 'block',
        fontFamily: 'var(--font-typewriter)',
        fontSize: 'var(--text-sm)',
        color: 'var(--color-ink-black)',
        marginBottom: 'var(--space-1)',
      }}>
        {label}
      </label>
      <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
        <input
          type={visible ? 'text' : 'password'}
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            flex: 1,
            fontFamily: 'var(--font-mono)',
            fontSize: 'var(--text-sm)',
            padding: 'var(--space-2)',
            border: '1px solid var(--color-paper-edge)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-paper-base)',
            color: 'var(--color-ink-black)',
          }}
        />
        <button
          onClick={() => setVisible(!visible)}
          style={{
            fontFamily: 'var(--font-typewriter)',
            fontSize: 'var(--text-xs)',
            padding: 'var(--space-1) var(--space-2)',
            background: 'var(--color-paper-light)',
            border: '1px solid var(--color-paper-edge)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            width: '60px',
          }}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      {value && !visible && (
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--color-ink-faded)',
          marginTop: 'var(--space-1)',
        }}>
          Stored: {maskedValue}
        </div>
      )}
    </div>
  );
}
