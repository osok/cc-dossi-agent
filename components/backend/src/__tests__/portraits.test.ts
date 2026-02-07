import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { portraitRoutes } from '../routes/portraits.js';
import { errorHandler } from '../middleware/error-handler.js';
import { resolveApiKeys } from '../middleware/api-keys.js';

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(resolveApiKeys);
  app.use('/api/portraits', portraitRoutes);
  app.use(errorHandler);
  return app;
}

describe('Portrait Routes', () => {
  // B-PRT-001: POST /agents/:id/portrait requires both API keys
  it('POST /api/portraits/agents/:id/portrait without keys returns 401', async () => {
    const app = createTestApp();
    const res = await request(app)
      .post('/api/portraits/agents/some-agent-id/portrait?projectId=00000000-0000-4000-8000-000000000000')
      .send({ style: 'anime' });

    expect(res.status).toBe(401);
  });

  // B-PRT-002: Validates style enum
  it('POST /api/portraits/agents/:id/portrait rejects invalid style', async () => {
    const app = createTestApp();
    const res = await request(app)
      .post('/api/portraits/agents/some-agent-id/portrait?projectId=00000000-0000-4000-8000-000000000000')
      .set('x-anthropic-key', 'test-key')
      .set('x-openai-key', 'test-key')
      .send({ style: 'invalid_style' });

    expect(res.status).toBe(400);
  });

  // Portrait without projectId returns 400
  it('POST /api/portraits/agents/:id/portrait without projectId returns 400', async () => {
    const app = createTestApp();
    const res = await request(app)
      .post('/api/portraits/agents/some-agent-id/portrait')
      .set('x-anthropic-key', 'test-key')
      .set('x-openai-key', 'test-key')
      .send({ style: 'anime' });

    expect(res.status).toBe(400);
  });

  // B-PRT-007: GET /portraits/:p/:a/:s returns 404 when not cached
  it('GET /api/portraits/:p/:a/:s returns 404 when not cached', async () => {
    const app = createTestApp();
    const res = await request(app)
      .get('/api/portraits/00000000-0000-4000-8000-000000000000/TestAgent/anime');

    expect(res.status).toBe(404);
  });
});
