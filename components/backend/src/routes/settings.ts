import { Router } from 'express';
import { z } from 'zod';
import { validateBody } from '../middleware/validation.js';

const validateKeysSchema = z.object({
  anthropic_key: z.string().optional(),
  openai_key: z.string().optional(),
});

export const settingsRoutes = Router();

// POST /api/settings/validate-keys - Validate API keys
settingsRoutes.post('/validate-keys', validateBody(validateKeysSchema), async (req, res, next) => {
  try {
    const results: Record<string, { valid: boolean; error?: string }> = {};

    // Validate Anthropic key
    if (req.body.anthropic_key) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': req.body.anthropic_key,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 1,
            messages: [{ role: 'user', content: 'test' }],
          }),
        });
        results.anthropic = { valid: response.status !== 401 };
        if (!results.anthropic.valid) {
          results.anthropic.error = 'Invalid API key';
        }
      } catch (err) {
        results.anthropic = { valid: false, error: 'Connection failed' };
      }
    }

    // Validate OpenAI key
    if (req.body.openai_key) {
      try {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${req.body.openai_key}`,
          },
        });
        results.openai = { valid: response.status === 200 };
        if (!results.openai.valid) {
          results.openai.error = 'Invalid API key';
        }
      } catch (err) {
        results.openai = { valid: false, error: 'Connection failed' };
      }
    }

    res.json(results);
  } catch (err) {
    next(err);
  }
});
