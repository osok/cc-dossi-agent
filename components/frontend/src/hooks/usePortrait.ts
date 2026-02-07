import { useState, useCallback } from 'react';
import { useProjectStore } from '../stores/projectStore';
import { useSettingsStore } from '../stores/settingsStore';
import * as portraitsApi from '../api/portraits';
import type { PortraitStyle } from '@agent-dossier/parser';

/**
 * Hook for portrait generation and loading logic.
 */
export function usePortrait(agentId: string, projectId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateAgent = useProjectStore((s) => s.updateAgent);
  const selectedStyle = useSettingsStore((s) => s.selectedStyle);

  const generate = useCallback(async (style?: PortraitStyle) => {
    setLoading(true);
    setError(null);
    const useStyle = style || selectedStyle;
    try {
      const result = await portraitsApi.generatePortrait(agentId, projectId, useStyle);
      updateAgent(agentId, {
        portraits: {
          ...useProjectStore.getState().project?.agents.find(a => a.id === agentId)?.portraits,
          [useStyle]: result.portrait_url,
        },
      });
      return result.portrait_url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Portrait generation failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [agentId, projectId, selectedStyle, updateAgent]);

  return { loading, error, generate };
}
