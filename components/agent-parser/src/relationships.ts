import type { ParsedAgent, AgentRelationship, RelationshipType } from './types.js';

interface RelationshipPattern {
  pattern: RegExp;
  type: RelationshipType;
  direction: 'outgoing' | 'incoming';
}

/**
 * Relationship detection patterns per Appendix C.
 * Each pattern extracts an agent name and determines direction.
 */
const RELATIONSHIP_PATTERNS: RelationshipPattern[] = [
  { pattern: /when invoked by ([\w][\w\s-]*[\w])/gi, type: 'reports_to', direction: 'incoming' },
  { pattern: /([\w][\w\s-]*[\w]) provides/gi, type: 'provides_to', direction: 'incoming' },
  { pattern: /route\s+\w+\s+(?:issues?\s+)?to\s+([\w][\w\s-]*[\w])/gi, type: 'invokes', direction: 'outgoing' },
  { pattern: /invoke[sd]?\s+(?:the\s+)?([\w][\w\s-]*[\w]?)(?:\s+agent)?/gi, type: 'invokes', direction: 'outgoing' },
  { pattern: /reviews?\s+(?:output\s+of\s+)?([\w][\w\s-]*[\w])/gi, type: 'reviews', direction: 'outgoing' },
];

/**
 * Detect relationships between agents from their markdown content.
 * Implements Appendix C patterns plus explicit name mention detection.
 *
 * @param agents - Array of all parsed agents (cross-referencing requires full set)
 * @returns Array of deduplicated relationships
 *
 * Satisfies: FR-REL-004
 */
export function detectRelationships(agents: ParsedAgent[]): AgentRelationship[] {
  const agentNames = new Map<string, string>();
  for (const agent of agents) {
    agentNames.set(agent.frontmatter.name.toLowerCase(), agent.frontmatter.name);
  }

  const relationships: AgentRelationship[] = [];
  const seen = new Set<string>();

  for (const agent of agents) {
    const agentNameLower = agent.frontmatter.name.toLowerCase();
    const fullText = agent.raw_markdown;

    // Apply regex patterns
    for (const { pattern, type, direction } of RELATIONSHIP_PATTERNS) {
      // Reset regex lastIndex for each agent
      pattern.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(fullText)) !== null) {
        const matchedName = match[1].trim();
        const matchedNameLower = matchedName.toLowerCase();

        // Find a known agent name: exact match, stripped "Agent" suffix, or prefix match
        const canonicalName = resolveAgentName(matchedNameLower, agentNames);
        if (canonicalName && canonicalName.toLowerCase() !== agentNameLower) {
          const source = direction === 'outgoing' ? agent.frontmatter.name : canonicalName;
          const target = direction === 'outgoing' ? canonicalName : agent.frontmatter.name;
          const key = `${source}|${target}|${type}`;

          if (!seen.has(key)) {
            seen.add(key);
            relationships.push({
              id: generateId(),
              source_agent: source,
              target_agent: target,
              relationship_type: type,
              description: `${source} ${type.replace('_', ' ')} ${target}`,
              evidence: match[0].trim(),
            });
          }
        }
      }
    }

    // Check for explicit agent name mentions in behavior section
    const behaviorContent = agent.mapped_sections.behavior?.content || '';
    for (const [otherNameLower, otherCanonical] of agentNames) {
      if (otherNameLower === agentNameLower) continue;
      if (behaviorContent.toLowerCase().includes(otherNameLower)) {
        const key = `${agent.frontmatter.name}|${otherCanonical}|references`;
        if (!seen.has(key)) {
          seen.add(key);
          relationships.push({
            id: generateId(),
            source_agent: agent.frontmatter.name,
            target_agent: otherCanonical,
            relationship_type: 'references',
            description: `${agent.frontmatter.name} references ${otherCanonical} in behavior`,
            evidence: `Mention in behavior section`,
          });
        }
      }
    }

    // Check cross-references section
    const crossRefContent = agent.mapped_sections.cross_references?.content || '';
    if (crossRefContent) {
      for (const [otherNameLower, otherCanonical] of agentNames) {
        if (otherNameLower === agentNameLower) continue;
        if (crossRefContent.toLowerCase().includes(otherNameLower)) {
          const key = `${agent.frontmatter.name}|${otherCanonical}|references`;
          if (!seen.has(key)) {
            seen.add(key);
            relationships.push({
              id: generateId(),
              source_agent: agent.frontmatter.name,
              target_agent: otherCanonical,
              relationship_type: 'references',
              description: `${agent.frontmatter.name} cross-references ${otherCanonical}`,
              evidence: `Listed in Cross-References section`,
            });
          }
        }
      }
    }
  }

  return relationships;
}

/**
 * Resolve a matched name to a known agent. Tries exact match, "Agent" suffix stripped,
 * and prefix matching (e.g., "Developer Agent for implementation" starts with "Developer").
 */
function resolveAgentName(matchedNameLower: string, agentNames: Map<string, string>): string | undefined {
  // Exact match
  if (agentNames.has(matchedNameLower)) return agentNames.get(matchedNameLower);

  // Strip trailing "agent" suffix
  const stripped = matchedNameLower.replace(/\s+agent\b.*$/i, '');
  if (stripped !== matchedNameLower && agentNames.has(stripped)) return agentNames.get(stripped);

  // Check if any known agent name is a prefix of the matched text
  for (const [nameLower, canonical] of agentNames) {
    if (matchedNameLower.startsWith(nameLower + ' ') || matchedNameLower === nameLower) {
      return canonical;
    }
    // Also check "name agent" prefix
    if (matchedNameLower.startsWith(nameLower + ' agent')) {
      return canonical;
    }
  }

  return undefined;
}

let idCounter = 0;
function generateId(): string {
  idCounter++;
  return `rel-${Date.now()}-${idCounter}`;
}
