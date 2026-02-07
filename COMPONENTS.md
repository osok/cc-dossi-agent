# Project Components

## Summary

| ID | Name | Type | Path | Status |
|----|------|------|------|--------|
| frontend | Dossier Frontend | frontend | components/frontend | pending |
| backend | API Server | backend | components/backend | pending |
| agent-parser | Agent Parser Library | library | components/agent-parser | pending |

---

## frontend

| Field | Value |
|-------|-------|
| **Name** | Dossier Frontend |
| **Type** | frontend |
| **Path** | components/frontend |
| **Description** | React 18+ single-page application providing the Mission Briefing-themed dossier UI. Includes tabbed agent dossiers, portrait display with style selector, RPG stat card radar charts, interactive relationship map (force-directed graph), workflow pipeline view, PDF export triggers, project save/load, and settings panel. |
| **Language** | TypeScript/React |
| **Depends On** | backend, agent-parser |
| **Port** | 3000 |
| **Status** | pending |

---

## backend

| Field | Value |
|-------|-------|
| **Name** | API Server |
| **Type** | backend |
| **Path** | components/backend |
| **Description** | Node.js 20+ REST API server. Proxies all external API calls (Anthropic Claude for enrichment/prompt crafting, OpenAI GPT Image 1.5 for portrait generation). Manages project persistence (CRUD), agent file upload/storage, portrait image caching, AI enrichment orchestration, and PDF generation. Exposes 12 REST endpoints consumed by the frontend. |
| **Language** | TypeScript/Node.js |
| **Depends On** | agent-parser |
| **Port** | 3001 |
| **Status** | pending |

---

## agent-parser

| Field | Value |
|-------|-------|
| **Name** | Agent Parser Library |
| **Type** | library |
| **Path** | components/agent-parser |
| **Description** | Shared library for parsing Claude Code agent markdown files. Extracts YAML frontmatter (name, description, tools, model), identifies markdown sections via flexible pattern matching (Behavior, Constraints, Inputs, Outputs, etc.), detects inter-agent relationships from cross-references and invocation patterns (Appendix C), derives workflow phase assignments from keywords (Appendix D), computes RPG stat card values using heuristics (Appendix B), and extracts tables/code blocks. Handles malformed and minimal files gracefully. |
| **Language** | TypeScript |
| **Status** | pending |
