import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';
import type { Root, Heading, Table, TableRow, Code, Content } from 'mdast';
import type { ParsedSection, MappedSections, MarkdownTable, CodeBlock } from './types.js';

/**
 * Section name mapping patterns (FR-PARSE-005).
 * Each key maps to an array of regex patterns that match varied heading text.
 */
const SECTION_PATTERNS: Record<string, RegExp[]> = {
  behavior: [/^behavio(?:u)?r$/i, /^how it works$/i, /^workflow$/i, /^process$/i],
  key_decisions: [/^key decision/i, /^decision area/i, /^decisions$/i],
  constraints: [/^constraints?$/i, /^limitations?$/i, /^rules$/i],
  inputs: [/^inputs?$/i, /^input format/i, /^input data/i],
  outputs: [/^outputs?$/i, /^output format/i, /^deliverables?$/i],
  success_criteria: [/^success criteria/i, /^acceptance criteria/i, /^exit criteria/i, /^done when/i],
  memory_integration: [/^memory/i],
  cross_references: [/^cross.?ref/i, /^related agents?/i, /^references$/i, /^see also$/i],
  return_format: [/^return format/i, /^task result/i, /^response format/i],
  log_entry: [/^log entry/i, /^logging/i, /^log output/i],
  console_output: [/^console output/i, /^console protocol/i],
};

/**
 * Parse markdown body into structured sections.
 * Uses remark/unified AST walking for reliable extraction (FR-PARSE-004).
 */
export function parseSections(markdownBody: string): {
  allSections: ParsedSection[];
  mappedSections: MappedSections;
} {
  const tree = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .parse(markdownBody);

  const allSections = extractSectionsFromAST(tree, markdownBody);
  const mappedSections = mapSections(allSections);

  return { allSections, mappedSections };
}

/**
 * Walk the AST and extract sections by heading boundaries.
 */
function extractSectionsFromAST(tree: Root, originalMarkdown: string): ParsedSection[] {
  const sections: ParsedSection[] = [];
  const headings: { node: Heading; index: number }[] = [];

  // Find all heading nodes and their positions
  tree.children.forEach((node, index) => {
    if (node.type === 'heading') {
      headings.push({ node: node as Heading, index });
    }
  });

  for (let i = 0; i < headings.length; i++) {
    const { node: heading, index: startIndex } = headings[i];
    const endIndex = i + 1 < headings.length ? headings[i + 1].index : tree.children.length;

    // Collect content nodes between this heading and the next
    const contentNodes = tree.children.slice(startIndex + 1, endIndex);
    const headingText = toString(heading);

    // Extract tables from content nodes
    const tables: MarkdownTable[] = [];
    const codeBlocks: CodeBlock[] = [];

    for (const node of contentNodes) {
      if (node.type === 'table') {
        tables.push(extractTable(node as Table));
      }
      if (node.type === 'code') {
        const codeNode = node as Code;
        codeBlocks.push({
          language: codeNode.lang || '',
          content: codeNode.value,
        });
      }
      // Also check for nested tables/code in other node types
      visit({ type: 'root', children: [node] } as Root, 'table', (tableNode) => {
        if (tableNode !== node) {
          tables.push(extractTable(tableNode as Table));
        }
      });
      visit({ type: 'root', children: [node] } as Root, 'code', (codeNode) => {
        if (codeNode !== node) {
          codeBlocks.push({
            language: (codeNode as Code).lang || '',
            content: (codeNode as Code).value,
          });
        }
      });
    }

    // Build content string from the original markdown using source positions
    // to preserve formatting (lists, code fences, emphasis, etc.)
    let content = '';
    for (const node of contentNodes) {
      if (node.position?.start.offset != null && node.position?.end.offset != null) {
        content += originalMarkdown.substring(
          node.position.start.offset,
          node.position.end.offset
        ) + '\n\n';
      } else {
        content += toString(node) + '\n\n';
      }
    }
    content = content.trim();

    sections.push({
      heading: headingText,
      level: heading.depth,
      content,
      tables,
      codeBlocks,
    });
  }

  return sections;
}

/**
 * Extract a markdown table into structured data (FR-PARSE-006).
 */
function extractTable(tableNode: Table): MarkdownTable {
  const rows = tableNode.children as TableRow[];
  if (rows.length === 0) {
    return { headers: [], rows: [] };
  }

  const headers = rows[0].children.map(cell => toString(cell));
  const dataRows = rows.slice(1).map(row =>
    row.children.map(cell => toString(cell))
  );

  return { headers, rows: dataRows };
}

/**
 * Map parsed sections to canonical section names using flexible pattern matching.
 */
function mapSections(sections: ParsedSection[]): MappedSections {
  const mapped: MappedSections = {};

  for (const section of sections) {
    const normalizedHeading = section.heading.trim();
    let matched = false;

    for (const [key, patterns] of Object.entries(SECTION_PATTERNS)) {
      if (patterns.some(p => p.test(normalizedHeading))) {
        if (!mapped[key]) {
          mapped[key] = section;
        }
        matched = true;
        break;
      }
    }

    // Store unmapped sections under their normalized heading key
    if (!matched) {
      const key = normalizedHeading
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
      if (key && !mapped[key]) {
        mapped[key] = section;
      }
    }
  }

  return mapped;
}
