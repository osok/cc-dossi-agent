# Agent Dossier

A Mission Briefing-themed web application that transforms Claude Code agent markdown files into visual dossier profiles with AI-enriched content, RPG stat cards, portrait generation, relationship maps, and workflow pipeline views.

## Overview

Agent Dossier parses agent markdown files (with YAML frontmatter and structured sections) and presents them as classified dossiers. The UI features a vintage briefing aesthetic with coffee rings, classified stamps, and tabbed folder navigation. AI capabilities include content enrichment via Claude and portrait generation via OpenAI.

## Features

- **Agent Parsing**: Extracts frontmatter, sections, relationships, workflow phases, and RPG stats
- **AI Enrichment**: Claude-powered content enhancement with motivation extraction and tactical notes
- **Portrait Generation**: OpenAI DALL-E image generation with multiple style options
- **Relationship Map**: Interactive force-directed graph showing agent connections
- **Pipeline View**: Visual workflow with 8 phases (Requirements → Finalization)
- **PDF Export**: Puppeteer-based dossier PDF generation
- **Project Management**: Create, save, load, and delete multi-agent projects
- **Settings**: API key management, model selection, and style preferences

## Quick Start

### Prerequisites

- Node.js 20+ (LTS recommended)
- pnpm 9+ (package manager)
- Optional: Docker + Docker Compose

### Local Development

```bash
# Clone repository
git clone <repository-url>
cd agent-dossier

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start development servers (all components in parallel)
pnpm dev
```

Development servers:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

### Docker Deployment

```bash
# Copy .env.example and configure API keys (optional)
cp components/backend/.env.example .env

# Build and start services
docker compose up
```

Access the application at http://localhost:3000

## Architecture

Agent Dossier is a pnpm workspace monorepo with three components:

### Components

| Component | Type | Path | Description |
|-----------|------|------|-------------|
| **agent-parser** | Library | `components/agent-parser` | Shared TypeScript library for parsing agent markdown files. Extracts YAML frontmatter, sections, relationships, phases, and stats. |
| **backend** | API Server | `components/backend` | Express.js REST API. Handles file uploads, AI proxying (Claude/OpenAI), project persistence, portrait caching, and PDF generation. |
| **frontend** | SPA | `components/frontend` | React 18 + Vite SPA. Mission Briefing UI with tabbed dossiers, radar charts, relationship maps, and pipeline views. |

### Technology Stack

**Build Tools**
- pnpm workspaces (monorepo management)
- TypeScript 5.6+ (strict mode, ESM modules)
- Vite 6 (frontend bundler)

**Agent Parser**
- unified + remark (markdown AST parsing)
- gray-matter (YAML frontmatter extraction)
- vitest (unit testing)

**Backend**
- Express 4 (HTTP server)
- multer (file upload handling)
- zod (schema validation)
- puppeteer (PDF generation)
- helmet + CORS (security middleware)

**Frontend**
- React 18 (UI library)
- Zustand (state management)
- React Flow (@xyflow/react) + dagre (relationship graph)
- Chart.js + react-chartjs-2 (radar charts)
- rehype-sanitize (HTML sanitization)

**Infrastructure**
- Docker multi-stage builds
- nginx (frontend serving)
- Chromium in backend container (for Puppeteer)

## Available Scripts

From the project root:

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all dependencies |
| `pnpm build` | Build all components (parser → backend → frontend) |
| `pnpm dev` | Start all dev servers in parallel |
| `pnpm test` | Run all test suites (107 tests across 16 files) |
| `pnpm lint` | Run linters on all components |
| `pnpm clean` | Remove dist and node_modules from all components |

Per-component scripts (run with `pnpm --filter <component> <script>`):
- `pnpm --filter @agent-dossier/parser test:watch`
- `pnpm --filter @agent-dossier/backend dev`
- `pnpm --filter @agent-dossier/frontend build`

## Environment Variables

Backend configuration via `.env` file (see `components/backend/.env.example`):

```bash
# Optional - can also be configured via UI Settings panel
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Server configuration
PORT=3001
DATA_DIR=./data
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

## Testing

The project includes comprehensive test coverage:

- **agent-parser**: 46 unit tests (frontmatter, sections, relationships, phases, stats, integration)
- **backend**: 34 API tests (project-store, middleware, projects, agents, portraits)
- **frontend**: 27 component tests (stores, API client, dossier, stat card, hooks)

Run tests with `pnpm test` or per-component with `pnpm --filter <component> test`.

## Documentation

- **Developer Guide**: `project-docs/developer-guide.md` - Setup, architecture, and contribution workflow
- **Architecture**: `project-docs/001-architecture-agent-dossier.md` - Architectural decisions and ADRs
- **Requirements**: `requirement-docs/agent-dossier.md` - Full requirements specification
- **Design Documents**: `design-docs/` - Component-level design documents
- **Test Plan**: `project-docs/001-test-plan-agent-dossier.md` - Test strategy and cases

## Project Management

For workflow commands and agent orchestration, see `CLAUDE.md`.

## License

See LICENSE file for details.
