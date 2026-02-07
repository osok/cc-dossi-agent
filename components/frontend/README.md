# @agent-dossier/frontend

React 18 single-page application for Agent Dossier with Mission Briefing aesthetic.

## Overview

Frontend provides:

- Tabbed agent dossier navigation
- Portrait display with style selector
- RPG stat radar charts (Chart.js)
- Interactive relationship map (React Flow + dagre)
- Workflow pipeline view (8 phases)
- Settings panel (API keys, model, style)
- Project management dialogs
- PDF export triggers
- Auto-save (60s debounce)

## Installation

```bash
pnpm install @agent-dossier/frontend
```

## Running

```bash
# Development (with HMR)
pnpm dev

# Production build
pnpm build

# Preview production build
pnpm preview
```

Development server: http://localhost:3000

## Configuration

Backend API URL is configured in `src/api/constants.ts`:

```typescript
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
```

Set via environment variable:

```bash
VITE_API_URL=http://localhost:3001/api pnpm dev
```

## Architecture

### Directory Structure

```
src/
├── __tests__/              # Component tests
├── components/
│   ├── layout/
│   │   ├── TopBar.tsx      # Header with actions
│   │   ├── StyleBar.tsx    # Secondary nav
│   │   └── TabNav.tsx      # Agent tabs
│   ├── dossier/
│   │   ├── DossierPage.tsx        # Main dossier view
│   │   ├── DossierHeader.tsx      # Agent header
│   │   ├── DossierSections.tsx    # Section list
│   │   ├── DossierFooter.tsx      # Footer stamps
│   │   ├── ClassifiedStamp.tsx    # Stamp overlays
│   │   ├── PhaseStamp.tsx         # Phase indicators
│   │   ├── CoffeeRing.tsx         # Aesthetic elements
│   │   └── FolderTab.tsx          # Tab component
│   ├── portrait/
│   │   ├── PortraitDisplay.tsx    # Portrait container
│   │   ├── PortraitPlaceholder.tsx # Loading state
│   │   └── StyleSelector.tsx      # Style dropdown
│   ├── stats/
│   │   └── StatCard.tsx           # Radar chart
│   ├── relationship/
│   │   ├── RelationshipMap.tsx    # React Flow graph
│   │   └── AgentNode.tsx          # Custom node
│   ├── pipeline/
│   │   ├── PipelineView.tsx       # 8-phase columns
│   │   ├── PhaseColumn.tsx        # Phase container
│   │   └── AgentCard.tsx          # Agent card
│   ├── settings/
│   │   ├── SettingsPanel.tsx      # Settings dialog
│   │   ├── ApiKeyInput.tsx        # Key input with test
│   │   └── ModelSelector.tsx      # Model dropdown
│   ├── project/
│   │   └── ProjectDialog.tsx      # CRUD dialogs
│   └── common/
│       ├── Badge.tsx              # Status badges
│       ├── Button.tsx             # Button component
│       ├── LoadingSpinner.tsx     # Loading state
│       ├── ProgressBar.tsx        # Progress indicator
│       └── ErrorBanner.tsx        # Error display
├── stores/
│   ├── projectStore.ts            # Project data
│   ├── uiStore.ts                 # UI state
│   └── relationshipStore.ts       # Graph positions
├── api/
│   ├── constants.ts               # API config
│   ├── projects.ts                # Project endpoints
│   ├── agents.ts                  # Agent endpoints
│   ├── portraits.ts               # Portrait endpoints
│   └── pdf.ts                     # PDF endpoints
├── utils/
│   ├── agentId.ts                 # ID utilities
│   └── validation.ts              # Input validation
├── hooks/
│   ├── useAutoSave.ts             # Auto-save hook
│   ├── useBatchOperation.ts       # Batch UI logic
│   ├── usePortrait.ts             # Portrait generation
│   └── useEnrichment.ts           # Enrichment logic
├── App.tsx                        # Main app component
└── main.tsx                       # React entry point
```

### State Management

Three Zustand stores:

**projectStore** - Project data

```typescript
{
  currentProject: Project | null;
  projects: Project[];
  agents: AgentData[];
  settings: Settings;
  updateProject: (updates) => void;
  addAgents: (agents) => void;
  // ...
}
```

**uiStore** - UI state

```typescript
{
  activeAgentId: string | null;
  activeView: 'dossier' | 'relationships' | 'pipeline';
  isSettingsOpen: boolean;
  loadingStates: Map<string, boolean>;
  errors: Map<string, string>;
  // ...
}
```

**relationshipStore** - Graph layout

```typescript
{
  nodePositions: Map<string, Position>;
  savePosition: (id, position) => void;
  // ...
}
```

### Component Patterns

**Functional components with hooks**

```typescript
export const DossierPage: React.FC = () => {
  const { agents, currentProject } = useProjectStore();
  const { activeAgentId } = useUIStore();

  const activeAgent = agents.find(a => a.id === activeAgentId);

  return (
    <div className="dossier-page">
      {activeAgent ? <DossierContent agent={activeAgent} /> : <EmptyState />}
    </div>
  );
};
```

**Custom hooks for logic reuse**

```typescript
export function useAutoSave() {
  const { currentProject } = useProjectStore();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentProject) {
        saveProject(currentProject);
      }
    }, 60000);

    return () => clearTimeout(timer);
  }, [currentProject]);
}
```

### Styling

**Inline CSS-in-JS** with design tokens:

```typescript
const styles = {
  dossierPage: {
    backgroundColor: 'var(--color-paper)',
    fontFamily: 'var(--font-typewriter)',
    padding: 'var(--spacing-lg)',
  },
};
```

**Design tokens** in `styles.css`:

```css
:root {
  --color-paper: #f5e6d3;
  --color-ink: #2c2416;
  --color-stamp-red: #8b1a1a;
  --font-typewriter: 'Courier New', monospace;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
}
```

### API Integration

API client modules use fetch:

```typescript
export async function createProject(data: CreateProjectInput): Promise<Project> {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to create project');
  }

  return response.json();
}
```

## Testing

```bash
# Run tests
pnpm test

# Watch mode
pnpm test:watch
```

Test coverage: 27 tests across 5 files.

**Test utilities**: React Testing Library + Vitest

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DossierPage } from './DossierPage';

describe('DossierPage', () => {
  it('renders agent dossier', () => {
    render(<DossierPage />);
    expect(screen.getByText('Agent Name')).toBeInTheDocument();
  });
});
```

## Development

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run linter
pnpm lint
```

## Dependencies

**Core**
- react - UI library (18.3+)
- react-dom - DOM rendering
- @agent-dossier/parser - Shared parser

**State Management**
- zustand - Lightweight state
- immer - Immutable updates

**Visualization**
- @xyflow/react - Relationship graph
- dagre - Graph layout algorithm
- chart.js - Radar charts
- react-chartjs-2 - React wrapper

**Utilities**
- rehype-sanitize - HTML sanitization

**Build Tools**
- vite - Bundler
- @vitejs/plugin-react - React plugin
- typescript - Type checking

## Build and Deployment

### Development Build

```bash
pnpm build
```

Output: `dist/` directory with optimized assets

### Docker Build

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY . .
RUN pnpm install && pnpm build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
```

### Nginx Configuration

```nginx
server {
  listen 3000;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /api {
    proxy_pass http://backend:3001;
  }
}
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

Requires modern JavaScript features: ES2020, ESM, fetch, async/await.

## Performance

- **Code splitting**: Vite automatic chunking
- **Lazy loading**: React.lazy for heavy components
- **Memoization**: useMemo/useCallback for expensive operations
- **Debouncing**: Auto-save and search inputs

## Accessibility

- Semantic HTML
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus management in dialogs

## License

See repository LICENSE file.
