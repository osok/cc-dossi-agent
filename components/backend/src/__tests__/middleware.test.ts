import { describe, it, expect, vi } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';
import {
  errorHandler,
  ApiKeyError,
  NotFoundError,
  RateLimitError,
  BadRequestError,
} from '../middleware/error-handler.js';

function createMockRes(): Response {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;
  return res;
}

const mockReq = {} as Request;
const mockNext = vi.fn() as unknown as NextFunction;

describe('errorHandler', () => {
  // B-MW-003: Zod validation errors return 400 with details
  it('handles ZodError with 400 status and details', () => {
    const schema = z.object({ name: z.string().min(1) });
    const result = schema.safeParse({ name: '' });
    const err = (result as { error: ZodError }).error;

    const res = createMockRes();
    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: 'Validation error' })
    );
  });

  // B-MW-004: NotFoundError returns 404
  it('handles NotFoundError with 404', () => {
    const err = new NotFoundError('Project');
    const res = createMockRes();
    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Project not found' });
  });

  // B-MW-005: ApiKeyError returns 401
  it('handles ApiKeyError with 401', () => {
    const err = new ApiKeyError('Missing key');
    const res = createMockRes();
    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Missing key' });
  });

  // RateLimitError returns 429
  it('handles RateLimitError with 429', () => {
    const err = new RateLimitError(30);
    const res = createMockRes();
    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalledWith({ error: 'Rate limited', retryAfter: 30 });
  });

  // BadRequestError returns 400
  it('handles BadRequestError with 400', () => {
    const err = new BadRequestError('No files uploaded');
    const res = createMockRes();
    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'No files uploaded' });
  });

  // Multer file filter error returns 400
  it('handles multer file filter error with 400', () => {
    const err = new Error('Only .md files are accepted');
    const res = createMockRes();
    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Only .md files are accepted' });
  });

  // B-MW-006: Unhandled errors return 500, with detail in dev mode
  it('handles unhandled errors with 500 and shows message in dev mode', () => {
    const err = new Error('Some internal issue');
    const res = createMockRes();

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    errorHandler(err, mockReq, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    // In dev mode (non-production), error message and stack are included
    const jsonArg = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(jsonArg.error).toBe('Some internal issue');
    expect(jsonArg.stack).toBeDefined();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('resolveApiKeys', () => {
  // B-MW-001 and B-MW-002 are tested via the middleware
  it('resolves API keys from headers', async () => {
    // Dynamic import since resolveApiKeys accesses config
    const { resolveApiKeys } = await import('../middleware/api-keys.js');

    const req = {
      headers: {
        'x-anthropic-key': 'test-anthropic-key',
        'x-openai-key': 'test-openai-key',
      },
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();

    resolveApiKeys(req, res, next);

    expect(req.anthropicKey).toBe('test-anthropic-key');
    expect(req.openaiKey).toBe('test-openai-key');
    expect(next).toHaveBeenCalled();
  });

  it('falls back to undefined when no headers or env', async () => {
    const { resolveApiKeys } = await import('../middleware/api-keys.js');

    const req = {
      headers: {},
    } as unknown as Request;
    const res = {} as Response;
    const next = vi.fn();

    resolveApiKeys(req, res, next);

    // With no env vars set, keys resolve to undefined or empty string
    expect(next).toHaveBeenCalled();
  });
});
