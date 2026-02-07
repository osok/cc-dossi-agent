/** Portrait style keys matching Appendix A */
export type PortraitStyle =
  | 'realistic_human'
  | 'peanuts'
  | 'looney_tunes'
  | 'archer'
  | 'comic_book'
  | 'anime'
  | 'pixel_art'
  | 'noir_sketch';

/** Claude model identifiers per DC-006 through DC-008 */
export type ClaudeModel =
  | 'claude-sonnet-4-5-20250929'
  | 'claude-opus-4-5'
  | 'claude-opus-4-6';

/** Image generation model identifiers */
export type ImageModel =
  | 'gpt-image-1'
  | 'dall-e-3'
  | 'gpt-image-1.5';

/** Relationship types between agents per Appendix C */
export type RelationshipType =
  | 'invokes'
  | 'references'
  | 'reports_to'
  | 'reviews'
  | 'provides_to';

/** Workflow phases per Appendix D */
export type WorkflowPhase =
  | 'requirements'
  | 'architecture'
  | 'design'
  | 'implementation'
  | 'review'
  | 'testing'
  | 'documentation'
  | 'unassigned';

/** YAML frontmatter fields extracted from agent files */
export interface AgentFrontmatter {
  name: string;
  description: string;
  tools: string[];
  model?: string;
}

/** A parsed markdown table */
export interface MarkdownTable {
  headers: string[];
  rows: string[][];
}

/** A parsed code block */
export interface CodeBlock {
  language: string;
  content: string;
}

/** A parsed markdown section */
export interface ParsedSection {
  heading: string;
  level: number;
  content: string;
  tables: MarkdownTable[];
  codeBlocks: CodeBlock[];
}

/** Communication links derived from parsing */
export interface AgentCommunication {
  talks_to: string[];
  receives_from: string[];
}

/** Mapped sections from flexible pattern matching (FR-PARSE-005) */
export interface MappedSections {
  behavior?: ParsedSection;
  key_decisions?: ParsedSection;
  constraints?: ParsedSection;
  inputs?: ParsedSection;
  outputs?: ParsedSection;
  success_criteria?: ParsedSection;
  memory_integration?: ParsedSection;
  cross_references?: ParsedSection;
  return_format?: ParsedSection;
  log_entry?: ParsedSection;
  console_output?: ParsedSection;
  /** Additional unmapped sections keyed by heading text */
  [key: string]: ParsedSection | undefined;
}

/** RPG stat card values (1-10 each) per Appendix B */
export interface AgentStats {
  scope: number;
  autonomy: number;
  connections: number;
  rigor: number;
  complexity: number;
}

/** AI enrichment data */
export interface EnrichmentData {
  codename: string;
  personality_traits: string[];
  mission_briefing: string;
  enhanced_relationships: Record<string, string>;
  stat_justifications: Record<keyof AgentStats, string>;
}

/** Portrait cache: style key to file path */
export type PortraitCache = Partial<Record<PortraitStyle, string>>;

/** Parsed agent data (output of parseAgentFile) */
export interface ParsedAgent {
  filename: string;
  raw_markdown: string;
  frontmatter: AgentFrontmatter;
  mapped_sections: MappedSections;
  communication: AgentCommunication;
  all_sections: ParsedSection[];
}

/** Complete agent data (with computed and AI-generated fields) */
export interface AgentData {
  id: string;
  filename: string;
  raw_markdown: string;
  frontmatter: AgentFrontmatter;
  mapped_sections: MappedSections;
  communication: AgentCommunication;
  stats: AgentStats;
  enrichment: EnrichmentData | null;
  portraits: PortraitCache;
  phase: WorkflowPhase;
}

/** Agent relationship edge */
export interface AgentRelationship {
  id: string;
  source_agent: string;
  target_agent: string;
  relationship_type: RelationshipType;
  description: string;
  evidence: string;
}

/** Project settings */
export interface ProjectSettings {
  selected_style: PortraitStyle;
  selected_model: ClaudeModel;
}

/** Complete project data */
export interface ProjectData {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  settings: ProjectSettings;
  agents: AgentData[];
  relationships: AgentRelationship[];
  relationship_map_positions?: Record<string, { x: number; y: number }>;
}

/** Project summary for list view */
export interface ProjectSummary {
  id: string;
  name: string;
  agent_count: number;
  created_at: string;
  updated_at: string;
}

/** All portrait styles with display names and prompt directives */
export const PORTRAIT_STYLES: Record<PortraitStyle, { displayName: string; directives: string }> = {
  realistic_human: {
    displayName: 'Realistic Human Photo',
    directives: 'Professional headshot photograph, studio lighting, neutral background, photorealistic, high detail, person embodies the described role',
  },
  peanuts: {
    displayName: 'Peanuts Cartoon',
    directives: 'Charles Schulz Peanuts style, simple line art, round head, dot eyes, minimal detail, pastel colors, wholesome',
  },
  looney_tunes: {
    displayName: 'Looney Tunes Cartoon',
    directives: 'Classic Looney Tunes cartoon style, exaggerated proportions, expressive face, bold outlines, bright saturated colors, comedic energy, vintage animation aesthetic',
  },
  archer: {
    displayName: 'Archer Cartoon',
    directives: 'Archer animated series style, semi-realistic proportions, cel-shaded, sharp lines, mid-century modern aesthetic, spy thriller tone',
  },
  comic_book: {
    displayName: 'Comic Book Superhero',
    directives: 'Comic book style, dynamic pose, bold ink outlines, halftone dot shading, heroic proportions, vibrant primary colors',
  },
  anime: {
    displayName: 'Anime / Manga',
    directives: 'Japanese anime style, large expressive eyes, stylized hair, clean lines, vibrant colors, dynamic expression',
  },
  pixel_art: {
    displayName: 'Pixel Art / 8-bit',
    directives: 'Retro 8-bit pixel art, blocky pixels visible, limited 16-color palette, nostalgic video game aesthetic',
  },
  noir_sketch: {
    displayName: 'Noir Detective Sketch',
    directives: 'Film noir charcoal sketch, high contrast black and white, dramatic shadows, moody atmospheric, detective aesthetic',
  },
};

/** Available Claude models with display names */
export const CLAUDE_MODELS: Record<ClaudeModel, { displayName: string }> = {
  'claude-sonnet-4-5-20250929': { displayName: 'Claude Sonnet 4.5' },
  'claude-opus-4-5': { displayName: 'Claude Opus 4.5' },
  'claude-opus-4-6': { displayName: 'Claude Opus 4.6' },
};

/** Available image generation models with display names */
export const IMAGE_MODELS: Record<ImageModel, { displayName: string }> = {
  'gpt-image-1': { displayName: 'GPT Image 1' },
  'gpt-image-1.5': { displayName: 'GPT Image 1.5' },
  'dall-e-3': { displayName: 'DALL-E 3' },
};
