import type { Request, Response, NextFunction } from 'express';
import { config } from '../config.js';

/**
 * Extend Express Request to include resolved API keys.
 */
declare global {
  namespace Express {
    interface Request {
      anthropicKey?: string;
      openaiKey?: string;
    }
  }
}

/**
 * Middleware to resolve API keys from request headers or environment variables.
 * UI-provided keys (headers) override server-side env vars (FR-CFG-004).
 */
export function resolveApiKeys(req: Request, _res: Response, next: NextFunction): void {
  req.anthropicKey =
    (req.headers['x-anthropic-key'] as string) || config.anthropicApiKey || undefined;
  req.openaiKey =
    (req.headers['x-openai-key'] as string) || config.openaiApiKey || undefined;
  next();
}
