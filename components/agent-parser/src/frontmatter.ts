import matter from 'gray-matter';
import type { AgentFrontmatter } from './types.js';

/**
 * Extract YAML frontmatter from an agent markdown file.
 * Handles missing or malformed frontmatter gracefully (FR-PARSE-008).
 */
export function extractFrontmatter(markdown: string, filename: string): {
  frontmatter: AgentFrontmatter;
  body: string;
} {
  try {
    const { data, content } = matter(markdown);

    return {
      frontmatter: {
        name: typeof data.name === 'string' ? data.name : deriveNameFromFilename(filename),
        description: typeof data.description === 'string' ? data.description : '',
        tools: normalizeTools(data.tools),
        model: typeof data.model === 'string' ? data.model : undefined,
      },
      body: content,
    };
  } catch {
    // Malformed YAML: treat entire content as body
    return {
      frontmatter: {
        name: deriveNameFromFilename(filename),
        description: '',
        tools: [],
        model: undefined,
      },
      body: markdown,
    };
  }
}

/**
 * Normalize tools field which can be a string, array, or undefined.
 */
function normalizeTools(tools: unknown): string[] {
  if (Array.isArray(tools)) {
    return tools.map(String).filter(Boolean);
  }
  if (typeof tools === 'string') {
    return tools.split(',').map(s => s.trim()).filter(Boolean);
  }
  return [];
}

/**
 * Derive a display name from a filename.
 * "architect.md" -> "Architect"
 * "code-reviewer-security.md" -> "Code Reviewer Security"
 */
function deriveNameFromFilename(filename: string): string {
  return filename
    .replace(/\.md$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim() || 'Unknown Agent';
}
