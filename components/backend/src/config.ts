import path from 'node:path';

export const config = {
  port: parseInt(process.env.PORT || '3030', 10),
  dataDir: path.resolve(process.env.DATA_DIR || './data'),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  nodeEnv: process.env.NODE_ENV || 'development',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  openaiApiKey: process.env.OPENAI_API_KEY || '',
} as const;
