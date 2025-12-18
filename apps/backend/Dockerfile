# Multi-stage Dockerfile for Backend
# Stage 1: Build
FROM node:20-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@10

# Set working directory
WORKDIR /app

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared-types/package.json ./packages/shared-types/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/backend ./apps/backend
COPY packages/shared-types ./packages/shared-types

# Build backend
WORKDIR /app/apps/backend
RUN pnpm build

# Stage 2: Production
FROM node:20-alpine AS production

# Install pnpm
RUN npm install -g pnpm@10

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY --chown=nestjs:nodejs package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=nestjs:nodejs apps/backend/package.json ./apps/backend/
COPY --chown=nestjs:nodejs packages/shared-types/package.json ./packages/shared-types/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built application from builder
COPY --chown=nestjs:nodejs --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --chown=nestjs:nodejs --from=builder /app/packages/shared-types ./packages/shared-types

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
WORKDIR /app/apps/backend
CMD ["node", "dist/main.js"]
