FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy package.json files for all workspaces
COPY components/agent-parser/package.json components/agent-parser/
COPY components/frontend/package.json components/frontend/

# Install dependencies
RUN corepack enable && pnpm install --frozen-lockfile

# Copy source code
COPY components/agent-parser/ components/agent-parser/
COPY components/frontend/ components/frontend/

# Build parser library first, then frontend
RUN pnpm --filter @agent-dossier/parser build && \
    pnpm --filter @agent-dossier/frontend build

# Production stage with nginx
FROM nginx:alpine
COPY --from=builder /app/components/frontend/dist /usr/share/nginx/html
COPY components/frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
