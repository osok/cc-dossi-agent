# @agent-dossier/parser

Shared TypeScript library for parsing Claude Code agent markdown files.

## Overview

The agent parser extracts structured data from agent markdown files including:

- YAML frontmatter (name, description, tools, model)
- Markdown sections (Behavior, Constraints, Inputs, Outputs, etc.)
- Inter-agent relationships (invocations, cross-references)
- Workflow phase assignments (Requirements, Architecture, Design, etc.)
- RPG stat card values (Autonomy, Complexity, Intelligence, Creativity, Precision)

## Installation

```bash
pnpm install @agent-dossier/parser
```

Note: This is a workspace package, not published to npm.

## Usage

```typescript
import { parseAgentFile } from '@agent-dossier/parser';

const content = `
---
name: Task Manager
description: Orchestrates workflow and tracks tasks
tools: [file_system, memory]
model: opus
---

## Behavior

Coordinates all agent work...
`;

const agentData = parseAgentFile(content);

console.log(agentData.name);        // "Task Manager"
console.log(agentData.sections);    // { behavior: "Coordinates all agent work..." }
console.log(agentData.relationships); // Array of detected relationships
console.log(agentData.phases);      // Array of workflow phases
console.log(agentData.stats);       // { autonomy: 85, complexity: 90, ... }
```

## API

### `parseAgentFile(content: string): AgentData`

Main entry point. Parses markdown content and returns structured data.

### `extractFrontmatter(content: string): AgentFrontmatter`

Extracts YAML frontmatter block and parses fields.

### `extractSections(content: string): AgentSections`

Identifies and extracts markdown sections using flexible pattern matching.

### `detectRelationships(content: string, frontmatter: AgentFrontmatter): AgentRelationship[]`

Finds relationships through cross-references (`@agent-name`) and invocation patterns.

### `detectPhases(content: string, sections: AgentSections): string[]`

Maps agent to workflow phases based on keyword matching.

### `deriveStats(content: string, frontmatter: AgentFrontmatter, sections: AgentSections): AgentStats`

Computes RPG stat values using heuristics from agent content.

## Type Definitions

```typescript
interface AgentData {
  name: string;
  description?: string;
  tools?: string[];
  model?: string;
  sections: AgentSections;
  relationships: AgentRelationship[];
  phases: string[];
  stats: AgentStats;
}

interface AgentSections {
  behavior?: string;
  constraints?: string;
  inputs?: string;
  outputs?: string;
  [key: string]: string | undefined;
}

interface AgentRelationship {
  targetAgent: string;
  relationshipType: 'invokes' | 'depends-on' | 'references';
  context?: string;
}

interface AgentStats {
  autonomy: number;      // 0-100
  complexity: number;    // 0-100
  intelligence: number;  // 0-100
  creativity: number;    // 0-100
  precision: number;     // 0-100
  justifications: {
    autonomy: string;
    complexity: string;
    intelligence: string;
    creativity: string;
    precision: string;
  };
}
```

## Testing

```bash
# Run unit tests
pnpm test

# Watch mode
pnpm test:watch
```

Test coverage: 46 tests across 6 test files.

## Development

```bash
# Build TypeScript
pnpm build

# Watch mode
pnpm dev
```

## Dependencies

- **unified** - Markdown AST parsing
- **remark-parse** - Markdown parser
- **remark-gfm** - GitHub Flavored Markdown support
- **gray-matter** - YAML frontmatter extraction
- **vitest** - Test runner

## Architecture

Parsing pipeline:

1. **Frontmatter extraction** - YAML block parsing with gray-matter
2. **Section detection** - Markdown AST traversal with flexible patterns
3. **Relationship detection** - Regex + AST analysis for cross-references
4. **Phase mapping** - Keyword matching against workflow phase definitions
5. **Stat derivation** - Heuristic scoring based on content analysis

## License

See repository LICENSE file.
