import { describe, it, expect } from 'vitest';
import { detectRelationships } from '../relationships.js';
import { parseAgentFile } from '../parser.js';
import fs from 'node:fs';
import path from 'node:path';

const fixturesDir = path.join(import.meta.dirname, '..', '__fixtures__');

function readFixture(name: string): string {
  return fs.readFileSync(path.join(fixturesDir, name), 'utf-8');
}

function makeParsedAgent(name: string, markdown: string) {
  return parseAgentFile(markdown, `${name.toLowerCase().replace(/\s/g, '-')}.md`);
}

describe('detectRelationships', () => {
  const architectMd = readFixture('architect-agent.md');
  const taskManagerMd = readFixture('task-manager-agent.md');
  const developerMd = readFixture('developer-agent.md');

  const architect = makeParsedAgent('Architect', architectMd);
  const taskManager = makeParsedAgent('Task Manager', taskManagerMd);
  const developer = makeParsedAgent('Developer', developerMd);

  // P-REL-001: Detect "When invoked by X" as incoming relationship
  it('detects "When invoked by X" as incoming relationship', () => {
    const rels = detectRelationships([architect, taskManager]);
    const invoked = rels.filter(
      r => r.target_agent === 'Architect' && r.source_agent === 'Task Manager' && r.relationship_type === 'reports_to'
    );
    expect(invoked.length).toBeGreaterThan(0);
  });

  // P-REL-002: Detect "route to X" as outgoing invokes relationship
  it('detects "route to" as outgoing invokes relationship', () => {
    const rels = detectRelationships([taskManager, developer]);
    const routes = rels.filter(r => r.relationship_type === 'invokes');
    expect(routes.length).toBeGreaterThan(0);
  });

  // P-REL-003: Detect cross-references section mentions
  it('detects cross-references section mentions', () => {
    const rels = detectRelationships([architect, taskManager, developer]);
    const crossRefs = rels.filter(
      r => r.source_agent === 'Architect' && r.relationship_type === 'references'
    );
    expect(crossRefs.length).toBeGreaterThan(0);
  });

  // P-REL-004: Detect behavior section agent name mentions
  it('detects behavior section agent name mentions', () => {
    const agentA = makeParsedAgent('Agent A', `---
name: Agent A
---
## Behavior
This agent works with Agent B to complete tasks.`);
    const agentB = makeParsedAgent('Agent B', `---
name: Agent B
---
## Behavior
Does things independently.`);

    const rels = detectRelationships([agentA, agentB]);
    const ref = rels.find(
      r => r.source_agent === 'Agent A' && r.target_agent === 'Agent B' && r.relationship_type === 'references'
    );
    expect(ref).toBeDefined();
  });

  // P-REL-005: Deduplicate relationships (same source+target+type)
  it('deduplicates relationships with same source+target+type', () => {
    const rels = detectRelationships([architect, taskManager, developer]);
    const keys = rels.map(r => `${r.source_agent}|${r.target_agent}|${r.relationship_type}`);
    const uniqueKeys = new Set(keys);
    expect(keys.length).toBe(uniqueKeys.size);
  });

  // P-REL-006: Do not create self-referencing relationships
  it('does not create self-referencing relationships', () => {
    const selfRefAgent = makeParsedAgent('Self Ref', `---
name: Self Ref
---
## Behavior
Self Ref agent invokes Self Ref for testing.

## Cross References
See: Self Ref`);

    const rels = detectRelationships([selfRefAgent]);
    const selfRels = rels.filter(r => r.source_agent === r.target_agent);
    expect(selfRels.length).toBe(0);
  });

  // P-REL-007: Only detect relationships to known agents
  it('only detects relationships to known agents in the set', () => {
    // Task Manager references many agents, but only ones in the array should be detected
    const rels = detectRelationships([taskManager]);
    // With only one agent, no relationships should be detected (no known targets)
    expect(rels.length).toBe(0);
  });

  // P-REL-008: Handle 0 agents (empty array)
  it('handles 0 agents (empty array)', () => {
    const rels = detectRelationships([]);
    expect(rels).toEqual([]);
  });

  // P-REL-009: Handle single agent (no relationships possible)
  it('handles single agent', () => {
    const single = makeParsedAgent('Solo', `---
name: Solo
---
## Behavior
Works alone.`);

    const rels = detectRelationships([single]);
    expect(rels.length).toBe(0);
  });
});
