import { AnthropicClient } from './anthropic-client.js';
import type { ClaudeModel, EnrichmentData } from '@agent-dossier/parser';

/**
 * Orchestrates AI enrichment for agent dossiers.
 *
 * Satisfies: FR-ENRICH-001 to FR-ENRICH-010
 */
export class EnrichmentService {
  private client: AnthropicClient;

  constructor(apiKey: string) {
    this.client = new AnthropicClient(apiKey);
  }

  /**
   * Enrich an agent with AI-generated content.
   */
  async enrich(
    agentMarkdown: string,
    model: ClaudeModel = 'claude-sonnet-4-5-20250929'
  ): Promise<EnrichmentData> {
    return this.client.enrich(agentMarkdown, model);
  }
}
