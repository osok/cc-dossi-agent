import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

/** Custom error for missing or invalid API keys */
export class ApiKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiKeyError';
  }
}

/** Custom error for rate limiting */
export class RateLimitError extends Error {
  public retryAfter: number;
  constructor(retryAfter: number) {
    super('Rate limited');
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/** Custom error for resource not found */
export class NotFoundError extends Error {
  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

/** Custom error for bad request (validation, missing params) */
export class BadRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BadRequestError';
  }
}

/**
 * Global async error handler middleware.
 * Catches all errors and returns consistent JSON error responses.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation error',
      details: err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; '),
    });
    return;
  }

  if (err instanceof ApiKeyError) {
    res.status(401).json({ error: err.message });
    return;
  }

  if (err instanceof RateLimitError) {
    res.status(429).json({ error: 'Rate limited', retryAfter: err.retryAfter });
    return;
  }

  if (err instanceof NotFoundError) {
    res.status(404).json({ error: err.message });
    return;
  }

  if (err instanceof BadRequestError) {
    res.status(400).json({ error: err.message });
    return;
  }

  // File upload errors from multer
  if (err.message === 'Only .md files are accepted') {
    res.status(400).json({ error: err.message });
    return;
  }

  console.error('Unhandled error:', err);
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(500).json({
    error: isDev ? err.message : 'Internal server error',
    ...(isDev && err.stack ? { stack: err.stack } : {}),
  });
}
