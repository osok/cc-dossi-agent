# Agent Dossier - User Guide

Welcome to Agent Dossier, your Mission Briefing-themed tool for visualizing and managing Claude Code agent files.

## What is Agent Dossier?

Agent Dossier transforms plain markdown agent files into rich, interactive dossiers with:

- Visual profiles with AI-generated portraits
- RPG-style stat cards showing agent capabilities
- Interactive relationship maps between agents
- Workflow pipeline visualization
- AI-enhanced content and insights
- PDF export for sharing

## Getting Started

### Prerequisites

To use all features, you'll need:
- API keys for AI features (optional):
  - **Anthropic API key** for content enrichment
  - **OpenAI API key** for portrait generation
- Agent markdown files to visualize

### First Launch

1. **Start the application**:
   - Local: Open http://localhost:3000 in your browser
   - Docker: Run `docker compose up` and open http://localhost:3000

2. **Create a new project**:
   - Click "New Project" in the top bar
   - Enter a project name
   - Click "Create"

3. **Upload agent files**:
   - Click "Upload Agent Files"
   - Select one or more `.md` files
   - Files are automatically parsed and displayed

## Core Features

### Agent Dossiers

The main view shows agent information in a classified dossier format:

- **Header**: Agent name and role
- **Portrait**: AI-generated image or placeholder
- **Sections**: Behavior, constraints, inputs, outputs, and more
- **Metadata**: Tools, model, and status badges
- **Footer**: Classified stamps and authenticity markers

Navigate between agents using the tabbed interface at the top.

### Portraits

Generate visual portraits for agents:

1. **Generate portrait**: Click the image placeholder or camera icon
2. **Select style**:
   - Professional - Business headshot
   - Artistic - Creative illustration
   - Cyberpunk - Futuristic aesthetic
   - Sketch - Hand-drawn style
3. **Wait for generation**: Takes 10-30 seconds
4. **Regenerate**: Click the refresh icon to create a new portrait

**Batch generation**: Click "Generate All Portraits" to create portraits for all agents at once.

### Stat Cards

View agent capabilities as RPG-style radar charts:

- **Autonomy**: Independent decision-making ability
- **Complexity**: Handles sophisticated scenarios
- **Intelligence**: Reasoning and analysis power
- **Creativity**: Novel solution generation
- **Precision**: Accuracy and attention to detail

Values are computed from agent descriptions and capabilities. Click a stat card to see the reasoning behind each score.

### Relationship Map

Visualize connections between agents:

- **Nodes**: Each agent is a node in the graph
- **Edges**: Lines show relationships (invokes, depends on, etc.)
- **Layout**: Automatically arranged using force-directed algorithm
- **Interactions**:
  - Drag nodes to reposition
  - Zoom with mouse wheel
  - Pan by clicking and dragging the background
  - Click "Fit View" to center all nodes

### Workflow Pipeline

See how agents fit into the development workflow:

- **8 Phases**: Requirements → Architecture → Design → Planning → Implementation → Review → Testing → Documentation
- **Agent Cards**: Each agent appears in its primary phase
- **Role Indicators**: Color-coded by agent type

### AI Enrichment

Enhance agent descriptions with AI insights:

1. **Configure API key** in Settings (see below)
2. **Click "Enrich" button** on an agent dossier
3. **Wait for processing** (5-15 seconds)
4. **View enriched content**:
   - Core motivation
   - Tactical notes
   - Success patterns
   - AI Enhanced badge appears

**Batch enrichment**: Click "Enrich All" to process all agents at once.

### PDF Export

Export agent dossiers as PDF files:

1. Select an agent
2. Click "Export PDF" in the top bar
3. PDF downloads automatically
4. Includes all sections, stats, and metadata

## Project Management

### Creating Projects

1. Click "New Project"
2. Enter a unique project name
3. Click "Create"
4. Upload agent files

### Saving Projects

Projects auto-save every 60 seconds. Manual save:
1. Click "Save" in the top bar
2. Confirmation appears when saved

### Loading Projects

1. Click "Load Project"
2. Select from the project list
3. Click "Load"
4. All agents, portraits, and enrichments restore

### Deleting Projects

1. Click "Delete" next to a project in the load dialog
2. Confirm deletion
3. Project and all data are removed

## Settings

Access settings via the gear icon in the top bar.

### API Keys

Configure API keys for AI features:

1. **Anthropic API Key**:
   - Required for content enrichment
   - Get from https://console.anthropic.com/
   - Format: `sk-ant-...`

2. **OpenAI API Key**:
   - Required for portrait generation
   - Get from https://platform.openai.com/
   - Format: `sk-...`

3. **Test Keys**: Click "Test" to verify keys work
4. **Save**: Keys are saved per project

### Model Selection

Choose the AI model for enrichment:
- **Claude Opus** - Highest quality, slower, more expensive
- **Claude Sonnet** - Balanced quality and speed (recommended)
- **Claude Haiku** - Fastest, most economical

### Portrait Style

Set the default style for portrait generation:
- Professional
- Artistic
- Cyberpunk
- Sketch

## Tips and Best Practices

### Uploading Agents

- **File format**: Markdown files (`.md`) with YAML frontmatter
- **Multiple uploads**: Select multiple files at once
- **Duplicates**: If an agent name already exists, you can replace or skip

### Agent File Format

Agent files should have this structure:

```markdown
---
name: Agent Name
description: Brief description
tools: [tool1, tool2]
model: opus
---

## Behavior

Agent behavior description...

## Constraints

Agent constraints...
```

### Organizing Large Projects

- Create separate projects for different agent sets
- Use descriptive project names
- Export PDFs for documentation
- Delete unused projects to save space

### Performance

- **Batch operations**: Use "Generate All" and "Enrich All" for efficiency
- **Portrait generation**: Generates in parallel (up to 3 at once)
- **Large projects**: 20+ agents may take longer to load

### Troubleshooting

**"API key invalid" errors**:
- Check key format in Settings
- Click "Test" to verify keys
- Ensure keys have sufficient credits

**Portraits not generating**:
- Verify OpenAI API key is set
- Check browser console for errors
- Try regenerating with a different style

**Enrichment fails**:
- Verify Anthropic API key is set
- Check agent has sufficient content
- Try again with a different model

**Project won't load**:
- Check project list for the project name
- Ensure no file corruption (check browser console)
- Create a new project and re-upload agents

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Tab | Next agent (when focused on tabs) |
| Shift+Tab | Previous agent |
| Ctrl/Cmd+S | Save project |
| Escape | Close dialogs |

## Privacy and Security

- **Local storage**: All data stored locally on your machine
- **API keys**: Stored in browser local storage (encrypt sensitive keys)
- **No telemetry**: No usage data is collected
- **File uploads**: Files processed locally, only AI API calls go to external services

## Support

For issues or questions:
- Check the developer guide in `project-docs/developer-guide.md`
- Review requirements in `requirement-docs/agent-dossier.md`
- See architectural decisions in `project-docs/001-architecture-agent-dossier.md`

## What's Next?

Explore these features:
1. Upload your agent files and generate portraits
2. Enrich agent descriptions with AI insights
3. Explore the relationship map
4. Review the workflow pipeline
5. Export dossiers as PDFs
6. Create multiple projects for different agent sets

Enjoy your mission briefings!
