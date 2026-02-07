import { AnthropicClient } from './anthropic-client.js';
import { OpenAIClient } from './openai-client.js';
import { ProjectStore } from './project-store.js';
import { PORTRAIT_STYLES } from '@agent-dossier/parser';
import type { AgentData, ImageModel, PortraitStyle } from '@agent-dossier/parser';

/**
 * Orchestrates portrait generation: Claude crafts the prompt,
 * OpenAI generates the image, and the result is cached to disk.
 *
 * Satisfies: FR-IMG-003 to FR-IMG-009, FR-IMG-013, FR-IMG-015
 */
export class PortraitService {
  private anthropic: AnthropicClient;
  private openai: OpenAIClient;
  private store: ProjectStore;

  constructor(anthropicKey: string, openaiKey: string, dataDir: string) {
    this.anthropic = new AnthropicClient(anthropicKey);
    this.openai = new OpenAIClient(openaiKey);
    this.store = new ProjectStore(dataDir);
  }

  /**
   * Generate a portrait for an agent in a specific style.
   * Returns the filesystem path to the saved PNG.
   */
  async generate(
    projectId: string,
    agent: AgentData,
    style: PortraitStyle,
    imageModel: ImageModel = 'gpt-image-1'
  ): Promise<string> {
    // Step 1: Use Claude to craft a tailored image prompt
    const styleInfo = PORTRAIT_STYLES[style];
    const prompt = await this.anthropic.craftImagePrompt(agent, style, styleInfo.directives);

    // Step 2: Send prompt to selected image model
    const imageBuffer = await this.openai.generateImage(prompt, imageModel);

    // Step 3: Save to disk cache
    const filePath = await this.store.savePortrait(
      projectId,
      agent.frontmatter.name,
      style,
      imageBuffer
    );

    return filePath;
  }
}
