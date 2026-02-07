import { apiRequest } from './client';
import type { PortraitStyle, ImageModel } from '@agent-dossier/parser';

interface PortraitResponse {
  portrait_url: string;
  cached: boolean;
}

interface BatchResult {
  agent_id: string;
  agent_name: string;
  status: 'success' | 'error';
  portrait_url?: string;
  error?: string;
}

interface BatchResponse {
  results: BatchResult[];
  completed: number;
  failed: number;
  total: number;
}

/**
 * Generate a portrait for a specific agent in a given style.
 * Pass regenerate: true to bypass cache and generate a new portrait.
 */
export function generatePortrait(
  agentId: string,
  projectId: string,
  style: PortraitStyle,
  regenerate = false,
  imageModel?: ImageModel
): Promise<PortraitResponse> {
  return apiRequest<PortraitResponse>(
    `/api/portraits/agents/${agentId}/portrait?projectId=${encodeURIComponent(projectId)}`,
    {
      method: 'POST',
      body: { style, ...(regenerate ? { regenerate: true } : {}), ...(imageModel ? { image_model: imageModel } : {}) },
    }
  );
}

/**
 * Batch generate portraits for multiple agents.
 */
export function batchGeneratePortraits(
  projectId: string,
  style: PortraitStyle,
  agentIds?: string[],
  imageModel?: ImageModel
): Promise<BatchResponse> {
  return apiRequest<BatchResponse>(
    `/api/portraits/projects/${projectId}/portraits/batch`,
    {
      method: 'POST',
      body: { style, agent_ids: agentIds, ...(imageModel ? { image_model: imageModel } : {}) },
    }
  );
}

/**
 * Get the URL for a cached portrait.
 */
export function getPortraitUrl(
  projectId: string,
  agentName: string,
  style: PortraitStyle
): string {
  return `/api/portraits/${projectId}/${encodeURIComponent(agentName)}/${style}`;
}
