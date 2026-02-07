import { useEffect } from 'react';
import { useProjectStore } from '../stores/projectStore';
import * as projectsApi from '../api/projects';

/**
 * Auto-save hook with 60s debounce.
 * Satisfies: FR-PROJ-007
 */
export function useAutoSave() {
  const project = useProjectStore((s) => s.project);
  const isDirty = useProjectStore((s) => s.isDirty);
  const markClean = useProjectStore((s) => s.markClean);
  const setError = useProjectStore((s) => s.setError);

  useEffect(() => {
    if (!isDirty || !project) return;

    const timer = setTimeout(async () => {
      try {
        await projectsApi.saveProject(project.id, project);
        markClean();
      } catch (err) {
        setError(`Auto-save failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }, 60_000); // 60 seconds

    return () => clearTimeout(timer);
  }, [isDirty, project, markClean, setError]);
}
