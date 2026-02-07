import { describe, it, expect } from 'vitest';
import { deriveStats } from '../stats.js';
import { parseAgentFile } from '../parser.js';
import fs from 'node:fs';
import path from 'node:path';

const fixturesDir = path.join(import.meta.dirname, '..', '__fixtures__');

function readFixture(name: string): string {
  return fs.readFileSync(path.join(fixturesDir, name), 'utf-8');
}

describe('deriveStats', () => {
  // P-ST-001: All stats return values between 1 and 10
  it('all stats return values between 1 and 10', () => {
    const fixtures = ['minimal-agent.md', 'complete-agent.md', 'architect-agent.md', 'task-manager-agent.md'];

    for (const fixture of fixtures) {
      const md = readFixture(fixture);
      const parsed = parseAgentFile(md, fixture);
      const stats = deriveStats(parsed);

      expect(stats.scope).toBeGreaterThanOrEqual(1);
      expect(stats.scope).toBeLessThanOrEqual(10);
      expect(stats.autonomy).toBeGreaterThanOrEqual(1);
      expect(stats.autonomy).toBeLessThanOrEqual(10);
      expect(stats.connections).toBeGreaterThanOrEqual(1);
      expect(stats.connections).toBeLessThanOrEqual(10);
      expect(stats.rigor).toBeGreaterThanOrEqual(1);
      expect(stats.rigor).toBeLessThanOrEqual(10);
      expect(stats.complexity).toBeGreaterThanOrEqual(1);
      expect(stats.complexity).toBeLessThanOrEqual(10);
    }
  });

  // P-ST-002: Scope score increases with output count and section count
  it('scope score increases with output count and section count', () => {
    const minimalMd = readFixture('minimal-agent.md');
    const completeMd = readFixture('complete-agent.md');

    const minimalStats = deriveStats(parseAgentFile(minimalMd, 'minimal-agent.md'));
    const completeStats = deriveStats(parseAgentFile(completeMd, 'complete-agent.md'));

    expect(completeStats.scope).toBeGreaterThanOrEqual(minimalStats.scope);
  });

  // P-ST-003: Autonomy score decreases with AskUserQuestion tool
  it('autonomy score decreases with AskUserQuestion tool', () => {
    const withoutAsk = parseAgentFile(`---
name: Autonomous
tools:
  - Read
  - Write
---
## Behavior
Works independently.`, 'auto.md');

    const withAsk = parseAgentFile(`---
name: Interactive
tools:
  - Read
  - Write
  - AskUserQuestion
---
## Behavior
Asks user for confirmation. Interactive mode. User approval required.`, 'interactive.md');

    const autoStats = deriveStats(withoutAsk);
    const interactiveStats = deriveStats(withAsk);

    expect(autoStats.autonomy).toBeGreaterThan(interactiveStats.autonomy);
  });

  // P-ST-004: Connections score increases with agent mentions
  it('connections score increases with agent mentions', () => {
    const isolated = parseAgentFile(`---
name: Isolated
tools: []
---
## Behavior
Works alone.`, 'isolated.md');

    const connected = parseAgentFile(`---
name: Connected
tools: []
---
## Behavior
Invokes Developer Agent for fixes. Invokes Test Runner for tests.
Route failures to Test Debugger. Invoked by Task Manager.
Reviews output of Code Reviewer. Reviews output of Security Agent.`, 'connected.md');

    const isolatedStats = deriveStats(isolated);
    const connectedStats = deriveStats(connected);

    expect(connectedStats.connections).toBeGreaterThan(isolatedStats.connections);
  });

  // P-ST-005: Rigor score increases with checkboxes and validation keywords
  it('rigor score increases with checkboxes and validation keywords', () => {
    const lax = parseAgentFile(`---
name: Lax
tools: []
---
## Behavior
Does stuff casually.`, 'lax.md');

    const rigorous = parseAgentFile(`---
name: Rigorous
tools: []
---
## Success Criteria
- [ ] Must validate all inputs
- [ ] Must verify output format
- [ ] Must check consistency
- [ ] Must audit security
- [ ] Must enforce naming conventions
- [ ] Must review all changes
## Behavior
Mandatory validation. Must verify. Must check. Shall enforce. Must audit. Must inspect.`, 'rigorous.md');

    const laxStats = deriveStats(lax);
    const rigorousStats = deriveStats(rigorous);

    expect(rigorousStats.rigor).toBeGreaterThan(laxStats.rigor);
  });

  // P-ST-006: Complexity score increases with word count and conditionals
  it('complexity score increases with word count and conditionals', () => {
    const simple = parseAgentFile(`---
name: Simple
tools: []
---
## Behavior
Does one thing.`, 'simple.md');

    const taskManagerMd = readFixture('task-manager-agent.md');
    const complex = parseAgentFile(taskManagerMd, 'task-manager-agent.md');

    const simpleStats = deriveStats(simple);
    const complexStats = deriveStats(complex);

    expect(complexStats.complexity).toBeGreaterThan(simpleStats.complexity);
  });

  // P-ST-007: Simple agent (minimal content) produces low stats
  it('simple agent produces low stats', () => {
    const md = readFixture('minimal-agent.md');
    const stats = deriveStats(parseAgentFile(md, 'minimal-agent.md'));

    // Minimal agent should have generally low scores
    const avg = (stats.scope + stats.connections + stats.rigor + stats.complexity) / 4;
    expect(avg).toBeLessThanOrEqual(5);
  });

  // P-ST-008: Complex agent (task-manager-like) produces high stats
  it('complex agent produces higher stats overall', () => {
    const md = readFixture('task-manager-agent.md');
    const stats = deriveStats(parseAgentFile(md, 'task-manager-agent.md'));

    // Task Manager should have above-average stats in several dimensions
    expect(stats.connections).toBeGreaterThanOrEqual(5);
    expect(stats.rigor).toBeGreaterThanOrEqual(4);
    expect(stats.complexity).toBeGreaterThanOrEqual(4);
  });
});
