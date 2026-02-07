import { describe, it, expect } from 'vitest';
import { extractFrontmatter } from '../frontmatter.js';
import fs from 'node:fs';
import path from 'node:path';

const fixturesDir = path.join(import.meta.dirname, '..', '__fixtures__');

function readFixture(name: string): string {
  return fs.readFileSync(path.join(fixturesDir, name), 'utf-8');
}

describe('extractFrontmatter', () => {
  // P-FM-001: Extract complete frontmatter
  it('extracts complete frontmatter with name, description, tools array, and model', () => {
    const md = readFixture('complete-agent.md');
    const { frontmatter, body } = extractFrontmatter(md, 'complete-agent.md');

    expect(frontmatter.name).toBe('Complete Agent');
    expect(frontmatter.description).toBe('A comprehensive agent with all section types');
    expect(frontmatter.tools).toEqual(['Read', 'Write', 'Bash', 'AskUserQuestion']);
    expect(frontmatter.model).toBe('claude-sonnet-4-5-20250929');
    expect(body).toContain('## Behavior');
  });

  // P-FM-002: Extract frontmatter with tools as comma-separated string
  it('handles tools as a comma-separated string', () => {
    const md = `---
name: Test Agent
tools: Read, Write, Bash
---
Content here`;

    const { frontmatter } = extractFrontmatter(md, 'test.md');
    expect(frontmatter.tools).toEqual(['Read', 'Write', 'Bash']);
  });

  // P-FM-003: Handle missing frontmatter
  it('handles missing frontmatter (no YAML block)', () => {
    const md = '## Behavior\n\nJust content, no frontmatter.';
    const { frontmatter, body } = extractFrontmatter(md, 'no-frontmatter.md');

    expect(frontmatter.name).toBe('No Frontmatter');
    expect(frontmatter.description).toBe('');
    expect(frontmatter.tools).toEqual([]);
    expect(frontmatter.model).toBeUndefined();
    expect(body).toContain('## Behavior');
  });

  // P-FM-004: Handle malformed YAML gracefully
  it('handles malformed YAML gracefully', () => {
    const md = readFixture('malformed-agent.md');
    const { frontmatter, body } = extractFrontmatter(md, 'malformed-agent.md');

    // Should derive name from filename since YAML is broken
    expect(frontmatter.name).toBeTruthy();
    expect(frontmatter.tools).toEqual([]);
    expect(body.length).toBeGreaterThan(0);
  });

  // P-FM-005: Derive name from filename when name field missing
  it('derives name from filename when name field is missing', () => {
    const md = `---
description: Some description
---
Content`;

    const { frontmatter } = extractFrontmatter(md, 'code-reviewer-security.md');
    expect(frontmatter.name).toBe('Code Reviewer Security');
  });

  // P-FM-006: Handle empty file
  it('handles empty file', () => {
    const { frontmatter, body } = extractFrontmatter('', 'empty-agent.md');

    expect(frontmatter.name).toBe('Empty Agent');
    expect(frontmatter.description).toBe('');
    expect(frontmatter.tools).toEqual([]);
    expect(body).toBe('');
  });

  // P-FM-007: Handle frontmatter with only name field
  it('handles frontmatter with only name field', () => {
    const md = `---
name: Minimal Agent
---

Content only.`;

    const { frontmatter } = extractFrontmatter(md, 'minimal.md');
    expect(frontmatter.name).toBe('Minimal Agent');
    expect(frontmatter.description).toBe('');
    expect(frontmatter.tools).toEqual([]);
    expect(frontmatter.model).toBeUndefined();
  });

  // P-FM-008: Normalize tools from various formats
  it('normalizes tools: string, array, and undefined all produce string[]', () => {
    // Array format
    const md1 = `---
name: Agent1
tools:
  - Read
  - Write
---`;
    expect(extractFrontmatter(md1, 'a.md').frontmatter.tools).toEqual(['Read', 'Write']);

    // String format
    const md2 = `---
name: Agent2
tools: Read, Write
---`;
    expect(extractFrontmatter(md2, 'b.md').frontmatter.tools).toEqual(['Read', 'Write']);

    // Undefined (no tools field)
    const md3 = `---
name: Agent3
---`;
    expect(extractFrontmatter(md3, 'c.md').frontmatter.tools).toEqual([]);
  });
});
