import crypto from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { upload } from '../middleware/upload.js';
import { validateBody } from '../middleware/validation.js';
import { ProjectStore } from '../services/project-store.js';
import { EnrichmentService } from '../services/enrichment.js';
import { config } from '../config.js';
import { ApiKeyError, BadRequestError, NotFoundError } from '../middleware/error-handler.js';
import { parseAgentFile, deriveStats, detectRelationships, detectPhase } from '@agent-dossier/parser';
import type { AgentData } from '@agent-dossier/parser';

const store = new ProjectStore(config.dataDir);

const enrichSchema = z.object({
  model: z.enum(['claude-sonnet-4-5-20250929', 'claude-opus-4-5', 'claude-opus-4-6']).optional(),
});

export const agentRoutes = Router();

// POST /api/projects/:id/agents - Upload agent .md files
// Query params:
//   ?duplicateAction=replace - Replace existing agents with same name
//   ?duplicateAction=skip    - Skip duplicate agents silently
//   (no param)               - Return 409 Conflict if duplicates detected, prompting user to choose
agentRoutes.post('/:projectId/upload', upload.array('files', 100), async (req, res, next) => {
  try {
    const projectId = req.params.projectId;
    const project = await store.get(projectId);
    const files = req.files as Express.Multer.File[];
    const duplicateAction = req.query.duplicateAction as string | undefined;

    if (!files || files.length === 0) {
      throw new BadRequestError('No files uploaded');
    }

    const newAgents: AgentData[] = [];
    const duplicates: string[] = [];

    for (const file of files) {
      const markdown = file.buffer.toString('utf-8');
      const parsed = parseAgentFile(markdown, file.originalname);
      const stats = deriveStats(parsed);
      const phase = detectPhase(parsed);

      // Check for duplicates
      const existing = project.agents.find(
        a => a.frontmatter.name.toLowerCase() === parsed.frontmatter.name.toLowerCase()
      );
      if (existing) {
        duplicates.push(parsed.frontmatter.name);
      }

      const agentData: AgentData = {
        id: crypto.randomUUID(),
        filename: file.originalname,
        raw_markdown: markdown,
        frontmatter: parsed.frontmatter,
        mapped_sections: parsed.mapped_sections,
        communication: parsed.communication,
        stats,
        enrichment: null,
        portraits: {},
        phase,
      };

      newAgents.push(agentData);
      await store.saveAgentFile(projectId, file.originalname, file.buffer);
    }

    // If duplicates found and no action specified, return 409 to prompt user (FR-PARSE-010)
    if (duplicates.length > 0 && !duplicateAction) {
      res.status(409).json({
        duplicates_detected: true,
        duplicates,
        message: `${duplicates.length} agent(s) already exist: ${duplicates.join(', ')}. Choose to replace or skip.`,
      });
      return;
    }

    // Process agents based on duplicate action
    for (const agent of newAgents) {
      const isDuplicate = duplicates.includes(agent.frontmatter.name);
      if (isDuplicate && duplicateAction === 'replace') {
        // Remove existing agent with same name and add the new version
        const existingIdx = project.agents.findIndex(
          a => a.frontmatter.name.toLowerCase() === agent.frontmatter.name.toLowerCase()
        );
        if (existingIdx !== -1) {
          // Preserve enrichment and portraits from existing agent if available
          const existing = project.agents[existingIdx];
          agent.enrichment = existing.enrichment;
          agent.portraits = existing.portraits;
          project.agents.splice(existingIdx, 1, agent);
        } else {
          project.agents.push(agent);
        }
      } else if (!isDuplicate) {
        // New agent, add directly
        project.agents.push(agent);
      }
      // If isDuplicate && duplicateAction === 'skip', do nothing (skip)
    }

    // Detect relationships across all agents
    const allParsed = project.agents.map(a => ({
      filename: a.filename,
      raw_markdown: a.raw_markdown,
      frontmatter: a.frontmatter,
      mapped_sections: a.mapped_sections,
      communication: a.communication,
      all_sections: [],
    }));
    project.relationships = detectRelationships(allParsed);

    // Save updated project
    project.updated_at = new Date().toISOString();
    await store.update(projectId, project);

    res.json({
      agents: newAgents.filter(a => {
        const isDuplicate = duplicates.includes(a.frontmatter.name);
        return !isDuplicate || duplicateAction === 'replace';
      }),
      relationships: project.relationships,
      duplicates,
      duplicateAction: duplicateAction || null,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:id/reparse - Re-parse all agents from their raw_markdown
agentRoutes.post('/projects/:projectId/reparse', async (req, res, next) => {
  try {
    const project = await store.get(req.params.projectId);

    for (const agent of project.agents) {
      const parsed = parseAgentFile(agent.raw_markdown, agent.filename);
      agent.mapped_sections = parsed.mapped_sections;
      agent.communication = parsed.communication;
      agent.frontmatter = parsed.frontmatter;
      agent.stats = deriveStats(parsed);
      agent.phase = detectPhase(parsed);
    }

    // Re-detect relationships
    const allParsed = project.agents.map(a => ({
      filename: a.filename,
      raw_markdown: a.raw_markdown,
      frontmatter: a.frontmatter,
      mapped_sections: a.mapped_sections,
      communication: a.communication,
      all_sections: [],
    }));
    project.relationships = detectRelationships(allParsed);

    project.updated_at = new Date().toISOString();
    await store.update(req.params.projectId, project);

    res.json({
      agents_reparsed: project.agents.length,
      agents: project.agents,
      relationships: project.relationships,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/agents/:id/enrich - Trigger AI enrichment for an agent
agentRoutes.post('/:agentId/enrich', validateBody(enrichSchema), async (req, res, next) => {
  try {
    if (!req.anthropicKey) {
      throw new ApiKeyError('Anthropic API key required for enrichment');
    }

    const enrichmentService = new EnrichmentService(req.anthropicKey);
    const model = req.body.model || 'claude-sonnet-4-5-20250929';

    // Find agent across all projects (simplified: expects projectId in query)
    const projectId = req.query.projectId as string;
    if (!projectId) {
      throw new BadRequestError('projectId query parameter required');
    }

    const project = await store.get(projectId);
    const agent = project.agents.find(a => a.id === req.params.agentId);
    if (!agent) {
      throw new NotFoundError('Agent');
    }

    const enrichment = await enrichmentService.enrich(agent.raw_markdown, model);
    agent.enrichment = enrichment;
    agent.stats = enrichment.stat_justifications
      ? {
          scope: parseInt(enrichment.stat_justifications.scope) || agent.stats.scope,
          autonomy: parseInt(enrichment.stat_justifications.autonomy) || agent.stats.autonomy,
          connections: parseInt(enrichment.stat_justifications.connections) || agent.stats.connections,
          rigor: parseInt(enrichment.stat_justifications.rigor) || agent.stats.rigor,
          complexity: parseInt(enrichment.stat_justifications.complexity) || agent.stats.complexity,
        }
      : agent.stats;

    project.updated_at = new Date().toISOString();
    await store.update(projectId, project);

    res.json({ enrichment: agent.enrichment, stats: agent.stats });
  } catch (err) {
    next(err);
  }
});
