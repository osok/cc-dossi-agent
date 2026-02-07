import { useState, useCallback } from 'react';
import { useProjectStore } from '../stores/projectStore';
import { useSettingsStore } from '../stores/settingsStore';
import * as agentsApi from '../api/agents';

/**
 * Hook for enrichment state management.
 */
export function useEnrichment(agentId: string, projectId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updateAgent = useProjectStore((s) => s.updateAgent);
  const selectedModel = useSettingsStore((s) => s.selectedModel);

  const enrich = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await agentsApi.enrichAgent(agentId, projectId, selectedModel);
      updateAgent(agentId, {
        enrichment: result.enrichment,
        stats: result.stats,
      });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Enrichment failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [agentId, projectId, selectedModel, updateAgent]);

  return { loading, error, enrich };
}
