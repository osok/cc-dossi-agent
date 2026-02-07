# @agent-dossier/backend

Express.js REST API server for Agent Dossier.

## Overview

Node.js backend providing:

- Project CRUD operations (filesystem-based)
- Agent file upload and parsing
- AI service proxying (Anthropic, OpenAI)
- Portrait generation and caching
- Content enrichment orchestration
- PDF generation with Puppeteer
- API key validation

## Installation

```bash
pnpm install @agent-dossier/backend
```

## Configuration

Create `.env` file:

```bash
# API Keys (optional - can be set via UI)
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Server
PORT=3001
DATA_DIR=./data
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

## Running

```bash
# Development (with hot reload)
pnpm dev

# Production
pnpm build
pnpm start
```

Server starts at http://localhost:3001 (or PORT from .env).

## API Endpoints

### Projects

```
POST   /api/projects          Create new project
GET    /api/projects          List all projects
GET    /api/projects/:id      Get project by ID
PUT    /api/projects/:id      Update project
DELETE /api/projects/:id      Delete project
```

### Agents

```
POST   /api/agents/upload     Upload and parse agent files
POST   /api/agents/enrich     Enrich agent content with AI
```

### Portraits

```
POST   /api/portraits/single  Generate single agent portrait
POST   /api/portraits/batch   Generate multiple portraits
GET    /api/portraits/:filename Retrieve cached portrait
```

### PDF

```
POST   /api/pdf/generate      Generate PDF for agent dossier
```

### Settings

```
POST   /api/settings/validate Validate API keys
```

## Request/Response Examples

### Upload Agent

```bash
POST /api/agents/upload
Content-Type: multipart/form-data

files: [agent1.md, agent2.md]
projectId: "uuid-here"
```

Response:

```json
{
  "agents": [
    {
      "id": "agent-id",
      "name": "Task Manager",
      "description": "Orchestrates workflow",
      "sections": { "behavior": "..." },
      "relationships": [],
      "phases": ["planning"],
      "stats": { "autonomy": 85, ... }
    }
  ]
}
```

### Enrich Agent

```bash
POST /api/agents/enrich
Content-Type: application/json

{
  "agentName": "Task Manager",
  "agentDescription": "Orchestrates workflow...",
  "sections": { "behavior": "..." },
  "apiKey": "sk-ant-...",
  "model": "claude-sonnet-4.0"
}
```

Response:

```json
{
  "motivation": "Ensures efficient coordination...",
  "tacticalNotes": "Best used for complex projects...",
  "successPatterns": ["Clear task delegation", "..."]
}
```

### Generate Portrait

```bash
POST /api/portraits/single
Content-Type: application/json

{
  "agentName": "Task Manager",
  "agentDescription": "Orchestrates workflow...",
  "style": "professional",
  "apiKey": "sk-..."
}
```

Response:

```json
{
  "success": true,
  "filename": "task-manager-professional-abc123.png",
  "url": "/api/portraits/task-manager-professional-abc123.png"
}
```

## Architecture

### Directory Structure

```
src/
├── __tests__/           # API integration tests
├── middleware/
│   ├── cors.ts          # CORS configuration
│   ├── helmet.ts        # Security headers (CSP)
│   ├── multer.ts        # File upload handling
│   └── error-handler.ts # Global error handler
├── routes/
│   ├── agents.ts        # Agent upload/enrichment
│   ├── portraits.ts     # Portrait generation
│   ├── projects.ts      # Project CRUD
│   ├── pdf.ts           # PDF generation
│   └── settings.ts      # API key validation
├── services/
│   ├── anthropic-client.ts # Claude API wrapper
│   ├── openai-client.ts    # OpenAI API wrapper
│   ├── portrait.ts         # Portrait orchestration
│   ├── pdf-generator.ts    # Puppeteer PDF rendering
│   └── project-store.ts    # Filesystem persistence
├── config.ts            # Configuration loader
└── index.ts             # Express app setup
```

### Services

**project-store.ts** - Filesystem-based project storage
- CRUD operations on `{DATA_DIR}/projects/{id}/`
- JSON serialization with validation
- Path traversal prevention

**anthropic-client.ts** - Claude API integration
- Content enrichment
- Prompt crafting
- Error handling and retries

**openai-client.ts** - OpenAI DALL-E integration
- Image generation with style prompts
- URL fetching and caching
- Rate limiting

**portrait.ts** - Portrait orchestration
- Filename generation (name + style + hash)
- Cache checking
- Image persistence

**pdf-generator.ts** - Puppeteer PDF generation
- HTML template with inline CSS
- Mission Briefing aesthetic
- 120s timeout

### Security

- **Helmet** - Security headers and CSP
- **CORS** - Restricted to FRONTEND_URL
- **Zod** - Request validation
- **Multer** - File type filtering (.md only)
- **Path validation** - Prevents traversal attacks
- **HTML escaping** - XSS prevention in PDFs

## Testing

```bash
# Run tests
pnpm test

# Watch mode
pnpm test:watch
```

Test coverage: 34 tests across 4 files.

## Development

```bash
# Start with hot reload
pnpm dev

# Run linter
pnpm lint

# Build
pnpm build
```

## Dependencies

**Core**
- express - HTTP server
- @agent-dossier/parser - Markdown parsing

**Middleware**
- cors - Cross-origin resource sharing
- helmet - Security headers
- multer - Multipart form data

**Validation**
- zod - Schema validation

**Services**
- puppeteer - PDF generation
- uuid - ID generation

## Docker

```dockerfile
FROM node:20-alpine
RUN apk add chromium
WORKDIR /app
COPY . .
RUN pnpm install && pnpm build
EXPOSE 3001
CMD ["node", "dist/index.js"]
```

Run with Docker Compose (see root `docker-compose.yml`).

## Troubleshooting

**API key errors**: Check .env or pass keys in requests

**File upload fails**: Verify DATA_DIR permissions and disk space

**PDF generation hangs**: Check Puppeteer timeout (120s default), ensure Chromium is installed

**Port already in use**: Change PORT in .env

## License

See repository LICENSE file.
