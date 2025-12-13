# Buffett Agent Dockerfile
# Image: deepracticexs/buffett
# Value investing analyst powered by AgentX + PromptX

# Build stage
FROM node:20-slim AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build frontend
RUN pnpm build

# Production stage
FROM deepracticexs/agent-runtime

WORKDIR /app

# Copy built assets and server code (as root first)
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Copy PromptX resources
COPY .promptx ./.promptx

# Install build tools for native modules and fix permissions
RUN sudo apt-get update && \
    sudo apt-get install -y python3 make g++ && \
    sudo apt-get clean && \
    sudo rm -rf /var/lib/apt/lists/* && \
    sudo chown -R node:node /app && \
    sudo npm install -g pnpm @promptx/cli tsx && \
    pnpm install --frozen-lockfile && \
    pnpm add dotenv tsx && \
    cd /app/node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3 && npm run build-release

# Create data directory and copy PromptX resources to user home
RUN mkdir -p /home/node/.agentx && \
    cp -r /app/.promptx /home/node/.promptx && \
    chown -R node:node /home/node/.promptx

# Environment - Defaults
ENV NODE_ENV=production
ENV PORT=5800
ENV AGENTX_DIR=/home/node/.agentx

# Environment - Required (must be provided at runtime)
# ANTHROPIC_API_KEY=sk-ant-xxxxx

# Run as non-root user
USER node

# Expose ports (HTTP + WebSocket)
EXPOSE 80 5800

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80/health || exit 1

# Run server
CMD ["tsx", "src/server.ts"]
