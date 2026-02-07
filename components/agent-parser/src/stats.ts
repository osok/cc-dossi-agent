import type { ParsedAgent, AgentStats } from './types.js';

/**
 * Derive RPG stat card values from parsed agent data.
 * Uses heuristics from Appendix B.
 *
 * Satisfies: FR-STAT-002, FR-STAT-003, FR-STAT-004
 */
export function deriveStats(parsed: ParsedAgent): AgentStats {
  return {
    scope: deriveScope(parsed),
    autonomy: deriveAutonomy(parsed),
    connections: deriveConnections(parsed),
    rigor: deriveRigor(parsed),
    complexity: deriveComplexity(parsed),
  };
}

/**
 * Scope: breadth of responsibilities.
 * Count of distinct output types + sections with responsibilities + documented modes.
 */
function deriveScope(parsed: ParsedAgent): number {
  let count = 0;

  // Count output types from outputs section
  const outputsContent = parsed.mapped_sections.outputs?.content || '';
  const outputLines = outputsContent.split('\n').filter(l => l.trim().startsWith('-') || l.trim().startsWith('|'));
  count += Math.min(outputLines.length, 5);

  // Count sections with substantive content (responsibilities)
  const substantiveSections = parsed.all_sections.filter(s => s.content.length > 50);
  count += Math.min(substantiveSections.length, 5);

  // Count documented modes
  const modeMatches = parsed.raw_markdown.match(/mode:\s*\w+/gi) || [];
  count += modeMatches.length;

  return mapScore(count, [2, 4, 6, 8]);
}

/**
 * Autonomy: independence vs. user interaction.
 * Check for AskUserQuestion tool, interactive keywords, user approval steps.
 */
function deriveAutonomy(parsed: ParsedAgent): number {
  const tools = parsed.frontmatter.tools;
  const text = parsed.raw_markdown.toLowerCase();

  const hasAskUser = tools.some(t =>
    t.toLowerCase().includes('askuserquestion') || t.toLowerCase() === 'ask'
  );
  const interactiveCount = (text.match(/interactive|user approval|confirm with user|ask user/g) || []).length;
  const heavyInteraction = (text.match(/interview|elicit|ask user about|prompt for/g) || []).length;

  if (heavyInteraction >= 3) return 2;
  if (hasAskUser && interactiveCount >= 2) return 4;
  if (hasAskUser || interactiveCount >= 1) return 7;
  return 10;
}

/**
 * Connections: inter-agent relationships.
 * Count of cross-reference mentions + agent names in behavior + invocation patterns.
 */
function deriveConnections(parsed: ParsedAgent): number {
  const mentions = new Set<string>();
  const text = parsed.raw_markdown;

  // Count invocation patterns
  const patterns = [
    /invoke[sd]?\s+(?:the\s+)?([\w][\w\s-]*)/gi,
    /route\s+\w+\s+to\s+([\w][\w\s-]*)/gi,
    /invoked by\s+([\w][\w\s-]*)/gi,
    /([\w][\w-]*)\s+(?:agent|provides|reviews)/gi,
  ];

  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    pattern.lastIndex = 0;
    while ((match = pattern.exec(text)) !== null) {
      const name = match[1].trim().toLowerCase();
      if (name.length > 2 && name.length < 40) {
        mentions.add(name);
      }
    }
  }

  // Also count talks_to and receives_from
  for (const name of parsed.communication.talks_to) mentions.add(name.toLowerCase());
  for (const name of parsed.communication.receives_from) mentions.add(name.toLowerCase());

  const count = mentions.size;
  if (count === 0) return 1;
  if (count <= 2) return 3;
  if (count <= 4) return 5;
  if (count <= 6) return 7;
  return 9;
}

/**
 * Rigor: checks, validations, quality gates.
 * Count of success criteria checkboxes + review/validation steps + re-review modes.
 */
function deriveRigor(parsed: ParsedAgent): number {
  const text = parsed.raw_markdown;

  const checkboxes = (text.match(/- \[[ x]\]/g) || []).length;
  const validationKeywords = (text.match(/\b(?:validat|verif|check|review|inspect|audit|enforce|mandatory|must|shall)\b/gi) || []).length;
  const total = checkboxes + Math.floor(validationKeywords / 3);

  return mapScore(total, [2, 5, 8, 12]);
}

/**
 * Complexity: depth of behavioral rules and decision logic.
 * Formula: (word_count / 200) + (mode_count x 2) + (conditional_count) + (table_count)
 */
function deriveComplexity(parsed: ParsedAgent): number {
  const text = parsed.raw_markdown;

  const wordCount = text.split(/\s+/).length;
  const modeCount = (text.match(/mode:\s*\w+/gi) || []).length;
  const conditionalCount = (text.match(/\b(?:if|when|unless|otherwise|else)\b/gi) || []).length;
  const tableRowCount = (text.match(/^\|.*\|$/gm) || []).length;
  const tableCount = Math.floor(tableRowCount / 3);

  const score = Math.floor(wordCount / 200) + (modeCount * 2) + conditionalCount + tableCount;

  return Math.min(10, Math.max(1, score));
}

/**
 * Map a count to a 1-10 score using threshold breakpoints.
 */
function mapScore(count: number, thresholds: [number, number, number, number]): number {
  if (count <= thresholds[0]) return 2;
  if (count <= thresholds[1]) return 4;
  if (count <= thresholds[2]) return 6;
  if (count <= thresholds[3]) return 8;
  return 10;
}
