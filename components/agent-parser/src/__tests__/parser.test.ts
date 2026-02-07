import { describe, it, expect } from 'vitest';
import { parseAgentFile } from '../parser.js';
import fs from 'node:fs';
import path from 'node:path';

const fixturesDir = path.join(import.meta.dirname, '..', '__fixtures__');

function readFixture(name: string): string {
  return fs.readFileSync(path.join(fixturesDir, name), 'utf-8');
}

describe('parseAgentFile', () => {
  // P-MAIN-001: parseAgentFile returns correct ParsedAgent structure
  it('returns correct ParsedAgent structure', () => {
    const md = readFixture('complete-agent.md');
    const result = parseAgentFile(md, 'complete-agent.md');

    expect(result).toHaveProperty('filename', 'complete-agent.md');
    expect(result).toHaveProperty('raw_markdown');
    expect(result).toHaveProperty('frontmatter');
    expect(result).toHaveProperty('mapped_sections');
    expect(result).toHaveProperty('communication');
    expect(result).toHaveProperty('all_sections');

    // Frontmatter
    expect(result.frontmatter.name).toBe('Complete Agent');
    expect(result.frontmatter.description).toContain('comprehensive');
    expect(result.frontmatter.tools).toContain('Read');
    expect(result.frontmatter.model).toBe('claude-sonnet-4-5-20250929');

    // Mapped sections
    expect(result.mapped_sections.behavior).toBeDefined();
    expect(result.mapped_sections.constraints).toBeDefined();
    expect(result.mapped_sections.inputs).toBeDefined();
    expect(result.mapped_sections.outputs).toBeDefined();
    expect(result.mapped_sections.success_criteria).toBeDefined();

    // All sections
    expect(result.all_sections.length).toBeGreaterThan(0);
  });

  // P-MAIN-002: Full pipeline with real agent file
  it('full pipeline: parses architect fixture correctly', () => {
    const md = readFixture('architect-agent.md');
    const result = parseAgentFile(md, 'architect-agent.md');

    expect(result.frontmatter.name).toBe('Architect');
    expect(result.frontmatter.description).toContain('architectural decisions');
    expect(result.frontmatter.tools).toContain('Read');
    expect(result.frontmatter.model).toBe('opus');

    // Section mapping
    expect(result.mapped_sections.behavior).toBeDefined();
    expect(result.mapped_sections.behavior!.content).toContain('technology decisions');
    expect(result.mapped_sections.key_decisions).toBeDefined();
    expect(result.mapped_sections.outputs).toBeDefined();
    expect(result.mapped_sections.success_criteria).toBeDefined();
    expect(result.mapped_sections.cross_references).toBeDefined();
  });

  // P-MAIN-003: Communication links derived from invoke/route patterns
  it('derives communication links from invoke and route patterns', () => {
    const md = readFixture('complete-agent.md');
    const result = parseAgentFile(md, 'complete-agent.md');

    // "When invoked by Task Manager" -> receives_from includes Task Manager
    expect(result.communication.receives_from.length).toBeGreaterThan(0);
    const receivesNames = result.communication.receives_from.map(n => n.toLowerCase());
    expect(receivesNames.some(n => n.includes('task manager'))).toBe(true);

    // "route issues to Developer Agent" -> talks_to includes Developer Agent
    expect(result.communication.talks_to.length).toBeGreaterThan(0);
  });

  // Additional: XSS content is preserved as-is in parsed data (not escaped at parse level)
  it('preserves XSS content as-is in parsed data', () => {
    const md = readFixture('xss-agent.md');
    const result = parseAgentFile(md, 'xss-agent.md');

    // Parser preserves raw content; escaping happens at render time
    expect(result.frontmatter.name).toContain('<script>');
    expect(result.frontmatter.tools.some(t => t.includes('<script>'))).toBe(true);
  });
});
