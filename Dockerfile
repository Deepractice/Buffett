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

# Copy built assets and server code
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./

# Install pnpm and PromptX CLI globally
RUN sudo npm install -g pnpm @promptx/cli

# Install production dependencies
RUN pnpm install --prod --frozen-lockfile

# Create data directory
RUN mkdir -p /home/node/.agentx

# Environment - Defaults
ENV NODE_ENV=production
ENV PORT=5800
ENV AGENTX_DIR=/home/node/.agentx

# Environment - Required (must be provided at runtime)
# ANTHROPIC_API_KEY=sk-ant-xxxxx

# Run as non-root user
USER node

# Expose port
EXPOSE 5800

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5800/health || exit 1

# Run server
CMD ["npx", "tsx", "src/server.ts"]
