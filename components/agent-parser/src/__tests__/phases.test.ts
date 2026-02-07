import { describe, it, expect } from 'vitest';
import { detectPhase } from '../phases.js';
import { parseAgentFile } from '../parser.js';
import fs from 'node:fs';
import path from 'node:path';

const fixturesDir = path.join(import.meta.dirname, '..', '__fixtures__');

function readFixture(name: string): string {
  return fs.readFileSync(path.join(fixturesDir, name), 'utf-8');
}

describe('detectPhase', () => {
  // P-PH-001: Detect architecture phase from agent name containing "architect"
  it('detects architecture phase from agent name containing "architect"', () => {
    const md = readFixture('architect-agent.md');
    const parsed = parseAgentFile(md, 'architect-agent.md');
    expect(detectPhase(parsed)).toBe('architecture');
  });

  // P-PH-002: Detect testing phase from agent name containing "test"
  it('detects testing phase from agent name containing "test"', () => {
    const parsed = parseAgentFile(`---
name: Test Runner
description: Runs all test suites
tools:
  - Bash
---
## Behavior
Runs tests and reports coverage results.`, 'test-runner.md');

    expect(detectPhase(parsed)).toBe('testing');
  });

  // P-PH-003: Detect phase from explicit "phase": "review" in content
  it('detects phase from explicit phase declaration in content', () => {
    const parsed = parseAgentFile(`---
name: Custom Agent
---
## Return Format
\`\`\`json
{"phase": "review", "action": "COMPLETE"}
\`\`\``, 'custom.md');

    expect(detectPhase(parsed)).toBe('review');
  });

  // P-PH-004: Return "unassigned" when no clear phase signal
  it('returns "unassigned" when no clear phase signal', () => {
    const parsed = parseAgentFile(`---
name: Generic Tool
---
## Behavior
Does generic stuff with no phase keywords.`, 'generic.md');

    expect(detectPhase(parsed)).toBe('unassigned');
  });

  // P-PH-005: Highest scoring phase wins when multiple signals present
  it('highest scoring phase wins when multiple signals present', () => {
    const parsed = parseAgentFile(`---
name: Developer
description: Developer agent for implementation
---
## Behavior
This developer implements code based on design documents. It creates implementation files.
The developer follows implementation patterns and developer conventions.`, 'developer.md');

    // "Developer" in name + multiple "implement" keywords should produce implementation
    expect(detectPhase(parsed)).toBe('implementation');
  });

  // P-PH-006: Map "development" to "implementation"
  it('maps "development" to "implementation" via phase declaration', () => {
    const parsed = parseAgentFile(`---
name: Builder
---
## Return Format
\`\`\`json
{"phase": "development", "action": "COMPLETE"}
\`\`\``, 'builder.md');

    expect(detectPhase(parsed)).toBe('implementation');
  });

  // Additional: Test real-world fixtures
  it('detects developer-agent.md as implementation phase', () => {
    const md = readFixture('developer-agent.md');
    const parsed = parseAgentFile(md, 'developer-agent.md');
    expect(detectPhase(parsed)).toBe('implementation');
  });
});
