FROM node:20-slim

# Install Chromium for Puppeteer PDF generation
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    fonts-noto-color-emoji \
    --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json files for needed workspaces
COPY components/agent-parser/package.json components/agent-parser/
COPY components/backend/package.json components/backend/

# Install dependencies
RUN corepack enable && pnpm install --frozen-lockfile

# Copy source code
COPY components/agent-parser/ components/agent-parser/
COPY components/backend/ components/backend/

# Build parser library and backend
RUN pnpm --filter @agent-dossier/parser build && \
    pnpm --filter @agent-dossier/backend build

# Create data directory
RUN mkdir -p /app/data

EXPOSE 3001

CMD ["node", "components/backend/dist/index.js"]
