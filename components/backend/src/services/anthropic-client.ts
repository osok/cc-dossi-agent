import type { ClaudeModel, EnrichmentData, AgentData, PortraitStyle, PORTRAIT_STYLES } from '@agent-dossier/parser';

const GENDERS = ['man', 'woman', 'man', 'woman', 'non-binary person'];
const AGES = [
  'young, exactly 24 years old, youthful face, no wrinkles',
  'exactly 30 years old, young adult',
  'exactly 38 years old, early middle age',
  'exactly 52 years old, visible laugh lines, some gray at temples',
  'elderly, exactly 65 years old, silver/gray hair, weathered face with deep wrinkles',
];
const ETHNICITIES = [
  'white European', 'Black African', 'East Asian', 'South Asian',
  'Latino/Hispanic', 'Middle Eastern', 'Southeast Asian', 'mixed race',
  'Indigenous', 'ginger/red-haired white', 'Mediterranean', 'Pacific Islander',
];

/**
 * Deterministic hash from agent name to pick diverse demographics.
 * Same name always produces same demographics for consistency.
 */
function getDemographics(agentName: string): { gender: string; age: string; ethnicity: string } {
  let hash = 0;
  for (let i = 0; i < agentName.length; i++) {
    hash = ((hash << 5) - hash + agentName.charCodeAt(i)) | 0;
  }
  hash = Math.abs(hash);
  return {
    gender: GENDERS[hash % GENDERS.length],
    age: AGES[(hash >>> 4) % AGES.length],
    ethnicity: ETHNICITIES[(hash >>> 8) % ETHNICITIES.length],
  };
}

/**
 * Anthropic Claude API client for enrichment and prompt crafting.
 *
 * Satisfies: FR-ENRICH-002 to FR-ENRICH-005, FR-IMG-003, FR-IMG-015
 */
export class AnthropicClient {
  private baseUrl = 'https://api.anthropic.com/v1/messages';

  constructor(private apiKey: string) {}

  /**
   * Enrich an agent with AI-generated content.
   * Sends the full markdown to Claude for analysis.
   */
  async enrich(agentMarkdown: string, model: ClaudeModel): Promise<EnrichmentData> {
    const response = await this.callClaude(model, [
      {
        role: 'user',
        content: `Analyze this Claude Code agent definition file and generate enrichment data.

Return ONLY a JSON object with these fields:
{
  "codename": "A unique thematic codename for this agent (2-3 words, evocative)",
  "personality_traits": ["trait1", "trait2", "trait3"],
  "mission_briefing": "A 2-4 sentence narrative description of this agent's mission and personality",
  "enhanced_relationships": {"agent_name": "description of relationship"},
  "stat_justifications": {
    "scope": "Justification for scope score (1-10)",
    "autonomy": "Justification for autonomy score (1-10)",
    "connections": "Justification for connections score (1-10)",
    "rigor": "Justification for rigor score (1-10)",
    "complexity": "Justification for complexity score (1-10)"
  }
}

Agent file:
${agentMarkdown}`,
      },
    ]);

    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      return JSON.parse(jsonMatch[0]) as EnrichmentData;
    } catch {
      throw new Error('Failed to parse enrichment response from Claude');
    }
  }

  /**
   * Craft a GPT Image prompt tailored to the agent and style.
   */
  async craftImagePrompt(
    agent: AgentData,
    style: PortraitStyle,
    styleDirectives: string
  ): Promise<string> {
    const demo = getDemographics(agent.frontmatter.name);

    const response = await this.callClaude('claude-sonnet-4-5-20250929', [
      {
        role: 'user',
        content: `Create a portrait image generation prompt for an AI agent character.

Agent Name: ${agent.frontmatter.name}
Agent Description: ${agent.frontmatter.description}
Agent Role: ${agent.mapped_sections.behavior?.content?.substring(0, 500) || 'Not specified'}
${agent.enrichment ? `Codename: ${agent.enrichment.codename}\nPersonality: ${agent.enrichment.personality_traits.join(', ')}` : ''}

Art Style: ${styleDirectives}

CRITICAL CHARACTER REQUIREMENTS — these override everything else:
- Gender: ${demo.gender}
- Age: ${demo.age}
- Ethnicity/appearance: ${demo.ethnicity}
These demographics are MANDATORY and NON-NEGOTIABLE. The character's age must be clearly visible in their face. Do NOT make everyone look middle-aged.

Generate a single, detailed image prompt that:
1. Creates a headshot/bust portrait of a ${demo.gender} who is ${demo.age}, with ${demo.ethnicity} appearance
2. The age MUST be visually obvious — include age-specific details (young smooth skin OR wrinkles OR gray hair as appropriate)
3. Uses the specified art style exactly
4. Captures the personality and function of the agent
5. Is suitable for a 1024x1024 image

Return ONLY the prompt text, nothing else.`,
      },
    ]);

    return response.trim();
  }

  /**
   * Make a call to the Claude Messages API with exponential backoff.
   */
  private async callClaude(
    model: ClaudeModel,
    messages: Array<{ role: string; content: string }>,
    maxRetries = 3
  ): Promise<string> {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model,
          max_tokens: 4096,
          messages,
        }),
      });

      if (response.status === 429) {
        if (attempt === maxRetries) {
          throw new Error('Rate limited by Anthropic API');
        }
        const retryAfter = parseInt(response.headers.get('retry-after') || '5');
        const delay = Math.min(retryAfter * 1000, 60000) * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Anthropic API error ${response.status}: ${errorBody}`);
      }

      const data = await response.json() as {
        content: Array<{ type: string; text: string }>;
      };

      const textBlock = data.content.find(c => c.type === 'text');
      return textBlock?.text || '';
    }

    throw new Error('Max retries exceeded for Anthropic API');
  }
}
