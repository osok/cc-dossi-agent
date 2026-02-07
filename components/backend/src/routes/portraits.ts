import { Router } from 'express';
import { z } from 'zod';
import path from 'node:path';
import { validateBody } from '../middleware/validation.js';
import { ProjectStore } from '../services/project-store.js';
import { PortraitService } from '../services/portrait.js';
import { config } from '../config.js';
import { ApiKeyError, NotFoundError, BadRequestError } from '../middleware/error-handler.js';
import type { ImageModel, PortraitStyle } from '@agent-dossier/parser';

const store = new ProjectStore(config.dataDir);

const imageModelEnum = z.enum(['gpt-image-1', 'gpt-image-1.5', 'dall-e-3']).optional();

const generatePortraitSchema = z.object({
  style: z.enum([
    'realistic_human', 'peanuts', 'looney_tunes', 'archer',
    'comic_book', 'anime', 'pixel_art', 'noir_sketch',
  ]),
  regenerate: z.boolean().optional(),
  image_model: imageModelEnum,
});

const batchSchema = z.object({
  style: z.enum([
    'realistic_human', 'peanuts', 'looney_tunes', 'archer',
    'comic_book', 'anime', 'pixel_art', 'noir_sketch',
  ]),
  agent_ids: z.array(z.string()).optional(),
  image_model: imageModelEnum,
});

export const portraitRoutes = Router();

// POST /api/agents/:agentId/portrait - Generate portrait for agent + style
portraitRoutes.post('/agents/:agentId/portrait', validateBody(generatePortraitSchema), async (req, res, next) => {
  try {
    if (!req.anthropicKey || !req.openaiKey) {
      throw new ApiKeyError('Both Anthropic and OpenAI API keys required for portrait generation');
    }

    const projectId = req.query.projectId as string;
    if (!projectId) {
      throw new BadRequestError('projectId query parameter required');
    }

    const project = await store.get(projectId);
    const agent = project.agents.find(a => a.id === req.params.agentId);
    if (!agent) {
      throw new NotFoundError('Agent');
    }

    const style = req.body.style as PortraitStyle;
    const regenerate = req.body.regenerate === true;
    const portraitService = new PortraitService(req.anthropicKey, req.openaiKey, config.dataDir);

    // Check cache first (skip if regenerating)
    if (!regenerate) {
      const cachedPath = await store.getPortraitPath(projectId, agent.frontmatter.name, style);
      if (cachedPath) {
        res.json({
          portrait_url: `/api/portraits/${projectId}/${encodeURIComponent(agent.frontmatter.name)}/${style}`,
          cached: true,
        });
        return;
      }
    }

    // Generate new portrait
    const imageModel = (req.body.image_model || 'gpt-image-1.5') as ImageModel;
    const portraitPath = await portraitService.generate(projectId, agent, style, imageModel);
    agent.portraits[style] = portraitPath;
    project.updated_at = new Date().toISOString();
    await store.update(projectId, project);

    res.json({
      portrait_url: `/api/portraits/${projectId}/${encodeURIComponent(agent.frontmatter.name)}/${style}`,
      cached: false,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/projects/:id/portraits/batch - Batch generate portraits
portraitRoutes.post('/projects/:projectId/portraits/batch', validateBody(batchSchema), async (req, res, next) => {
  try {
    if (!req.anthropicKey || !req.openaiKey) {
      throw new ApiKeyError('Both Anthropic and OpenAI API keys required for portrait generation');
    }

    const project = await store.get(req.params.projectId);
    const style = req.body.style as PortraitStyle;
    const agentIds = req.body.agent_ids || project.agents.map(a => a.id);
    const imageModel = (req.body.image_model || 'gpt-image-1.5') as ImageModel;
    const portraitService = new PortraitService(req.anthropicKey, req.openaiKey, config.dataDir);

    const results: Array<{
      agent_id: string;
      agent_name: string;
      status: 'success' | 'error';
      portrait_url?: string;
      error?: string;
    }> = [];

    for (const agentId of agentIds) {
      const agent = project.agents.find(a => a.id === agentId);
      if (!agent) {
        results.push({ agent_id: agentId, agent_name: 'unknown', status: 'error', error: 'Agent not found' });
        continue;
      }

      try {
        const cachedPath = await store.getPortraitPath(req.params.projectId, agent.frontmatter.name, style);
        if (!cachedPath) {
          const portraitPath = await portraitService.generate(req.params.projectId, agent, style, imageModel);
          agent.portraits[style] = portraitPath;
        }
        results.push({
          agent_id: agentId,
          agent_name: agent.frontmatter.name,
          status: 'success',
          portrait_url: `/api/portraits/${req.params.projectId}/${encodeURIComponent(agent.frontmatter.name)}/${style}`,
        });
      } catch (err) {
        results.push({
          agent_id: agentId,
          agent_name: agent.frontmatter.name,
          status: 'error',
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    project.updated_at = new Date().toISOString();
    await store.update(req.params.projectId, project);

    res.json({
      results,
      completed: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'error').length,
      total: results.length,
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/portraits/:projectId/:agentName/:style - Retrieve cached portrait
portraitRoutes.get('/:projectId/:agentName/:style', async (req, res, next) => {
  try {
    const { projectId, agentName, style } = req.params;
    const portraitPath = await store.getPortraitPath(projectId, decodeURIComponent(agentName), style as PortraitStyle);

    if (!portraitPath) {
      throw new NotFoundError('Portrait');
    }

    res.sendFile(path.resolve(portraitPath));
  } catch (err) {
    next(err);
  }
});
