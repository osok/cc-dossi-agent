import { useCallback } from 'react';
import { useUIStore } from '../stores/uiStore';

/**
 * Hook for batch operation progress tracking.
 * Satisfies: FR-IMG-007, FR-ENRICH-009
 */
export function useBatchOperation() {
  const setBatchProgress = useUIStore((s) => s.setBatchProgress);
  const clearBatchProgress = useUIStore((s) => s.clearBatchProgress);

  const runBatch = useCallback(
    async <T>(
      label: string,
      items: T[],
      processFn: (item: T, index: number) => Promise<void>
    ) => {
      setBatchProgress(0, items.length, label);
      const results: Array<{ item: T; error?: Error }> = [];

      for (let i = 0; i < items.length; i++) {
        try {
          await processFn(items[i], i);
          results.push({ item: items[i] });
        } catch (err) {
          results.push({ item: items[i], error: err instanceof Error ? err : new Error(String(err)) });
        }
        setBatchProgress(i + 1, items.length, label);
      }

      clearBatchProgress();
      return results;
    },
    [setBatchProgress, clearBatchProgress]
  );

  return { runBatch };
}
