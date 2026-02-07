import { describe, it, expect } from 'vitest';
import { parseSections } from '../sections.js';

describe('parseSections', () => {
  // P-SC-001: Parse ## Behavior section by heading
  it('parses ## Behavior section by heading', () => {
    const body = `## Behavior

This agent does things step by step.

## Constraints

Must follow rules.`;

    const { mappedSections } = parseSections(body);
    expect(mappedSections.behavior).toBeDefined();
    expect(mappedSections.behavior!.content).toContain('step by step');
    expect(mappedSections.constraints).toBeDefined();
  });

  // P-SC-002: Map "Behaviour" (UK spelling) to behavior section
  it('maps "Behaviour" (UK spelling) to behavior section', () => {
    const body = `## Behaviour

UK spelling variant of behavior.`;

    const { mappedSections } = parseSections(body);
    expect(mappedSections.behavior).toBeDefined();
    expect(mappedSections.behavior!.content).toContain('UK spelling');
  });

  // P-SC-003: Map "How It Works" to behavior section
  it('maps "How It Works" to behavior section', () => {
    const body = `## How It Works

Alternative heading for behavior.`;

    const { mappedSections } = parseSections(body);
    expect(mappedSections.behavior).toBeDefined();
    expect(mappedSections.behavior!.content).toContain('Alternative heading');
  });

  // P-SC-004: Parse all 11 section types when present
  it('parses all 11 section types when present', () => {
    const body = `## Behavior
b content
## Key Decision Areas
kd content
## Constraints
c content
## Inputs
i content
## Outputs
o content
## Success Criteria
sc content
## Memory Integration
mi content
## Cross References
cr content
## Return Format
rf content
## Log Entry
le content
## Console Output
co content`;

    const { mappedSections } = parseSections(body);
    expect(mappedSections.behavior).toBeDefined();
    expect(mappedSections.key_decisions).toBeDefined();
    expect(mappedSections.constraints).toBeDefined();
    expect(mappedSections.inputs).toBeDefined();
    expect(mappedSections.outputs).toBeDefined();
    expect(mappedSections.success_criteria).toBeDefined();
    expect(mappedSections.memory_integration).toBeDefined();
    expect(mappedSections.cross_references).toBeDefined();
    expect(mappedSections.return_format).toBeDefined();
    expect(mappedSections.log_entry).toBeDefined();
    expect(mappedSections.console_output).toBeDefined();
  });

  // P-SC-005: Extract markdown tables into structured data
  it('extracts markdown tables into structured data', () => {
    const body = `## Key Decision Areas

| Decision | Route To |
|----------|----------|
| Arch issue | Architect |
| Code fix | Developer |`;

    const { mappedSections } = parseSections(body);
    const section = mappedSections.key_decisions;
    expect(section).toBeDefined();
    expect(section!.tables.length).toBeGreaterThan(0);
    expect(section!.tables[0].headers).toEqual(['Decision', 'Route To']);
    expect(section!.tables[0].rows).toEqual([
      ['Arch issue', 'Architect'],
      ['Code fix', 'Developer'],
    ]);
  });

  // P-SC-006: Extract code blocks with language tags
  it('extracts code blocks with language tags', () => {
    const body = `## Return Format

\`\`\`json
{"status": "complete"}
\`\`\``;

    const { mappedSections } = parseSections(body);
    const section = mappedSections.return_format;
    expect(section).toBeDefined();
    expect(section!.codeBlocks.length).toBeGreaterThan(0);
    expect(section!.codeBlocks[0].language).toBe('json');
    expect(section!.codeBlocks[0].content).toContain('"status"');
  });

  // P-SC-007: Handle nested headings (### under ##)
  it('handles nested headings (### under ##)', () => {
    const body = `## Behavior

Main behavior content.

### Sub-behavior

Nested content here.

## Constraints

Rules section.`;

    const { allSections } = parseSections(body);
    expect(allSections.length).toBe(3);
    expect(allSections[0].heading).toBe('Behavior');
    expect(allSections[0].level).toBe(2);
    expect(allSections[1].heading).toBe('Sub-behavior');
    expect(allSections[1].level).toBe(3);
  });

  // P-SC-008: Store unmapped sections under normalized heading key
  it('stores unmapped sections under normalized heading key', () => {
    const body = `## Custom Section Name

Custom content here.`;

    const { mappedSections } = parseSections(body);
    expect(mappedSections['custom_section_name']).toBeDefined();
    expect(mappedSections['custom_section_name']!.content).toContain('Custom content');
  });

  // P-SC-009: Handle document with no headings
  it('handles document with no headings', () => {
    const body = `Just plain text without any headings.

Some more text here.`;

    const { allSections, mappedSections } = parseSections(body);
    expect(allSections.length).toBe(0);
    expect(Object.keys(mappedSections).length).toBe(0);
  });

  // P-SC-010: Handle document with empty sections
  it('handles document with empty sections', () => {
    const body = `## Behavior

## Constraints

Some content here.`;

    const { allSections } = parseSections(body);
    expect(allSections.length).toBe(2);
    // First section (Behavior) should have empty/minimal content
    expect(allSections[0].heading).toBe('Behavior');
    // Second section should have content
    expect(allSections[1].heading).toBe('Constraints');
    expect(allSections[1].content).toContain('Some content');
  });
});
