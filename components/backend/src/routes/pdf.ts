import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validation.js';
import { ProjectStore } from '../services/project-store.js';
import { PdfGenerator } from '../services/pdf-generator.js';
import { config } from '../config.js';

const store = new ProjectStore(config.dataDir);

const exportSchema = z.object({
  agent_ids: z.array(z.string()).optional(),
  include_cover: z.boolean().optional().default(true),
});

export const pdfRoutes = Router();

// POST /api/projects/:id/export/pdf - Generate and download PDF
pdfRoutes.post('/projects/:id/export/pdf', validateBody(exportSchema), async (req, res, next) => {
  try {
    const project = await store.get(req.params.id);
    const agentIds = req.body.agent_ids || project.agents.map(a => a.id);
    const agents = project.agents.filter(a => agentIds.includes(a.id));

    const pdfGenerator = new PdfGenerator();
    const pdfBuffer = agents.length === 1
      ? await pdfGenerator.generateDossierPdf(agents[0], project)
      : await pdfGenerator.generateAllDossiersPdf(agents, project, req.body.include_cover);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${project.name}-dossiers.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
});
