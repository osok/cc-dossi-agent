import { extractFrontmatter } from './frontmatter.js';
import { parseSections } from './sections.js';
import type { ParsedAgent, AgentCommunication } from './types.js';

/**
 * Parse a single agent markdown file into structured data.
 *
 * @param markdown - Raw markdown content of the agent file
 * @param filename - Original filename for reference and fallback name derivation
 * @returns Parsed agent data (without enrichment, stats, or portraits)
 *
 * Satisfies: FR-PARSE-002 (frontmatter), FR-PARSE-003 (sections),
 * FR-PARSE-004 (flexible parsing), FR-PARSE-005 (pattern matching),
 * FR-PARSE-006 (tables), FR-PARSE-007 (code blocks),
 * FR-PARSE-008 (graceful handling of malformed files)
 */
export function parseAgentFile(markdown: string, filename: string): ParsedAgent {
  const { frontmatter, body } = extractFrontmatter(markdown, filename);
  const { allSections, mappedSections } = parseSections(body);

  // Derive basic communication from section content
  const communication = deriveCommunication(markdown, mappedSections);

  return {
    filename,
    raw_markdown: markdown,
    frontmatter,
    mapped_sections: mappedSections,
    communication,
    all_sections: allSections,
  };
}

/**
 * Derive basic communication links from agent content.
 * More thorough relationship detection is in relationships.ts.
 */
function deriveCommunication(
  markdown: string,
  mappedSections: Record<string, unknown>
): AgentCommunication {
  const talksTo = new Set<string>();
  const receivesFrom = new Set<string>();

  // Look for "invoked by" patterns
  const invokedByPattern = /(?:when )?invoked by (\w[\w\s-]*\w)/gi;
  let match;
  while ((match = invokedByPattern.exec(markdown)) !== null) {
    receivesFrom.add(match[1].trim());
  }

  // Look for "route to" patterns
  const routeToPattern = /route\s+\w+\s+to\s+(\w[\w\s-]*\w)/gi;
  while ((match = routeToPattern.exec(markdown)) !== null) {
    talksTo.add(match[1].trim());
  }

  // Look for "invoke" patterns
  const invokePattern = /invoke[sd]?\s+(?:the\s+)?(\w[\w\s-]*\w?)(?:\s+agent)?/gi;
  while ((match = invokePattern.exec(markdown)) !== null) {
    const target = match[1].trim();
    if (target.length > 2 && target.length < 50) {
      talksTo.add(target);
    }
  }

  return {
    talks_to: Array.from(talksTo),
    receives_from: Array.from(receivesFrom),
  };
}
