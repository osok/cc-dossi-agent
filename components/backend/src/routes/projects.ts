import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validation.js';
import { ProjectStore } from '../services/project-store.js';
import { config } from '../config.js';

const store = new ProjectStore(config.dataDir);

const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  settings: z.object({
    selected_style: z.string(),
    selected_model: z.string(),
  }).optional(),
  agents: z.array(z.any()).optional(),
  relationships: z.array(z.any()).optional(),
  relationship_map_positions: z.record(z.object({ x: z.number(), y: z.number() })).optional(),
}); // zod default strips unknown fields (id, created_at, updated_at)

export const projectRoutes = Router();

// POST /api/projects - Create a new project
projectRoutes.post('/', validateBody(createProjectSchema), async (req, res, next) => {
  try {
    const project = await store.create(req.body.name);
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
});

// GET /api/projects - List all saved projects
projectRoutes.get('/', async (_req, res, next) => {
  try {
    const projects = await store.list();
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

// GET /api/projects/:id - Load a project with all data
projectRoutes.get('/:id', async (req, res, next) => {
  try {
    const project = await store.get(req.params.id);
    res.json(project);
  } catch (err) {
    next(err);
  }
});

// PUT /api/projects/:id - Save/update project state
projectRoutes.put('/:id', validateBody(updateProjectSchema), async (req, res, next) => {
  try {
    const project = await store.update(req.params.id, req.body);
    res.json(project);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/projects/:id - Delete a project and all data
projectRoutes.delete('/:id', async (req, res, next) => {
  try {
    await store.delete(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});
