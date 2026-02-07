import { apiUpload, ApiError } from './client';
import { apiRequest } from './client';
import type { AgentData, AgentRelationship, EnrichmentData, AgentStats, ClaudeModel } from '@agent-dossier/parser';

interface UploadResponse {
  agents: AgentData[];
  relationships: AgentRelationship[];
  duplicates: string[];
  duplicateAction: string | null;
}

export interface DuplicateConflictResponse {
  duplicates_detected: true;
  duplicates: string[];
  message: string;
}

export interface EnrichResponse {
  enrichment: EnrichmentData;
  stats: AgentStats;
}

/**
 * Check if an error is a duplicate conflict (409) response.
 */
export function isDuplicateConflict(err: unknown): err is ApiError & { body: DuplicateConflictResponse } {
  return (
    err instanceof ApiError &&
    err.status === 409 &&
    typeof err.body === 'object' &&
    err.body !== null &&
    'duplicates_detected' in err.body &&
    (err.body as DuplicateConflictResponse).duplicates_detected === true
  );
}

/**
 * Upload agent .md files to a project.
 * @param duplicateAction - 'replace' to overwrite existing agents, 'skip' to skip them, undefined to detect and prompt
 */
export function uploadAgents(
  projectId: string,
  files: File[],
  duplicateAction?: 'replace' | 'skip'
): Promise<UploadResponse> {
  const queryParam = duplicateAction ? `?duplicateAction=${duplicateAction}` : '';
  return apiUpload<UploadResponse>(
    `/api/agents/${projectId}/upload${queryParam}`,
    files
  );
}

interface ReparseResponse {
  agents_reparsed: number;
  agents: AgentData[];
  relationships: AgentRelationship[];
}

/**
 * Re-parse all agents in a project from their raw markdown.
 * Use after parser updates to refresh section content.
 */
export function reparseAgents(projectId: string): Promise<ReparseResponse> {
  return apiRequest<ReparseResponse>(
    `/api/agents/projects/${projectId}/reparse`,
    { method: 'POST' }
  );
}

/**
 * Trigger AI enrichment for a specific agent.
 */
export function enrichAgent(
  agentId: string,
  projectId: string,
  model?: ClaudeModel
): Promise<EnrichResponse> {
  return apiRequest<EnrichResponse>(
    `/api/agents/${agentId}/enrich?projectId=${encodeURIComponent(projectId)}`,
    {
      method: 'POST',
      body: { model },
    }
  );
}
