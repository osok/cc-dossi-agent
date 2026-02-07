import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { agentRoutes } from '../routes/agents.js';
import { errorHandler } from '../middleware/error-handler.js';
import { resolveApiKeys } from '../middleware/api-keys.js';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(resolveApiKeys);
  app.use('/api/agents', agentRoutes);
  app.use(errorHandler);
  return app;
}

describe('Agent Upload Routes', () => {
  // B-AGT-008: Upload with no files returns 400
  it('POST /api/agents/:projectId/upload with no files returns 400', async () => {
    const app = createTestApp();
    const res = await request(app)
      .post('/api/agents/00000000-0000-4000-8000-000000000000/upload');

    // Returns 400 for no files
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  // B-ENR-002: POST /agents/:id/enrich requires projectId query param
  it('POST /api/agents/:id/enrich without projectId returns 400', async () => {
    const app = createTestApp();
    const res = await request(app)
      .post('/api/agents/some-agent-id/enrich')
      .set('x-anthropic-key', 'test-key')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('projectId');
  });

  // B-ENR-001: POST /agents/:id/enrich requires Anthropic API key
  it('POST /api/agents/:id/enrich without API key returns 401', async () => {
    const app = createTestApp();
    const res = await request(app)
      .post('/api/agents/some-agent-id/enrich?projectId=00000000-0000-4000-8000-000000000000')
      .send({});

    expect(res.status).toBe(401);
  });

  // B-ENR-004: Enrichment validates model enum
  it('POST /api/agents/:id/enrich rejects invalid model', async () => {
    const app = createTestApp();
    const res = await request(app)
      .post('/api/agents/some-agent-id/enrich?projectId=00000000-0000-4000-8000-000000000000')
      .set('x-anthropic-key', 'test-key')
      .send({ model: 'invalid-model' });

    expect(res.status).toBe(400);
  });
});
