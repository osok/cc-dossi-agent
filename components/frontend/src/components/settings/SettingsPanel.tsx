import { useState } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { validateKeys } from '../../api/settings';
import ApiKeyInput from './ApiKeyInput';
import ModelSelector from './ModelSelector';
import ImageModelSelector from './ImageModelSelector';
import Button from '../common/Button';
import styles from './SettingsPanel.module.css';

/**
 * Settings panel (modal/drawer) for API keys, model, and style selection.
 * Satisfies: FR-CFG-001 to FR-CFG-008
 */
export default function SettingsPanel() {
  const showSettings = useUIStore((s) => s.showSettings);
  const closeSettings = useUIStore((s) => s.closeSettings);

  const anthropicKey = useSettingsStore((s) => s.anthropicKey);
  const openaiKey = useSettingsStore((s) => s.openaiKey);
  const selectedModel = useSettingsStore((s) => s.selectedModel);
  const selectedImageModel = useSettingsStore((s) => s.selectedImageModel);
  const setAnthropicKey = useSettingsStore((s) => s.setAnthropicKey);
  const setOpenaiKey = useSettingsStore((s) => s.setOpenaiKey);
  const setModel = useSettingsStore((s) => s.setModel);
  const setImageModel = useSettingsStore((s) => s.setImageModel);
  const clearKeys = useSettingsStore((s) => s.clearKeys);

  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<string | null>(null);

  if (!showSettings) return null;

  const handleValidate = async () => {
    setValidating(true);
    setValidationResult(null);
    try {
      const result = await validateKeys({
        anthropic_key: anthropicKey || undefined,
        openai_key: openaiKey || undefined,
      });

      const messages: string[] = [];
      if (result.anthropic) {
        messages.push(`Anthropic: ${result.anthropic.valid ? 'Valid' : result.anthropic.error || 'Invalid'}`);
      }
      if (result.openai) {
        messages.push(`OpenAI: ${result.openai.valid ? 'Valid' : result.openai.error || 'Invalid'}`);
      }
      setValidationResult(messages.join(' | ') || 'No keys to validate');
    } catch (err) {
      setValidationResult(`Validation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={closeSettings}>
      <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Settings</h2>
          <button className={styles.closeButton} onClick={closeSettings}>
            X
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>API Keys</h3>
            <p className={styles.sectionNote}>
              Keys are stored in session storage only and cleared when the browser tab closes.
            </p>

            <ApiKeyInput
              label="Anthropic API Key"
              value={anthropicKey}
              onChange={setAnthropicKey}
              placeholder="sk-ant-..."
            />

            <ApiKeyInput
              label="OpenAI API Key"
              value={openaiKey}
              onChange={setOpenaiKey}
              placeholder="sk-..."
            />

            <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-4)' }}>
              <Button variant="primary" size="small" onClick={handleValidate} loading={validating}>
                Validate Keys
              </Button>
              <Button variant="danger" size="small" onClick={clearKeys}>
                Clear Keys
              </Button>
            </div>

            {validationResult && (
              <p style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 'var(--text-xs)',
                color: 'var(--color-ink-faded)',
                padding: 'var(--space-2)',
                background: 'var(--color-paper-base)',
                borderRadius: 'var(--radius-sm)',
              }}>
                {validationResult}
              </p>
            )}
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>AI Configuration</h3>
            <ModelSelector value={selectedModel} onChange={setModel} />
            <ImageModelSelector value={selectedImageModel} onChange={setImageModel} />
          </div>
        </div>
      </div>
    </div>
  );
}
