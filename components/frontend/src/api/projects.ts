import { apiRequest } from './client';
import type { ProjectData, ProjectSummary } from '@agent-dossier/parser';

const BASE = '/api/projects';

/**
 * Create a new project.
 */
export function createProject(name: string): Promise<ProjectData> {
  return apiRequest<ProjectData>(BASE, {
    method: 'POST',
    body: { name },
  });
}

/**
 * List all saved projects.
 */
export function listProjects(): Promise<ProjectSummary[]> {
  return apiRequest<ProjectSummary[]>(BASE);
}

/**
 * Load a project with all data.
 */
export function loadProject(id: string): Promise<ProjectData> {
  return apiRequest<ProjectData>(`${BASE}/${id}`);
}

/**
 * Save/update project state.
 */
export function saveProject(
  id: string,
  data: Partial<ProjectData>
): Promise<ProjectData> {
  return apiRequest<ProjectData>(`${BASE}/${id}`, {
    method: 'PUT',
    body: data,
  });
}

/**
 * Delete a project and all data.
 */
export function deleteProject(id: string): Promise<void> {
  return apiRequest<void>(`${BASE}/${id}`, {
    method: 'DELETE',
  });
}
