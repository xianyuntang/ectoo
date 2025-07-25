# Build stage
FROM node:22.14.0-slim AS builder

# Set working directory
WORKDIR /app

# Copy package files from root and app
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/

# Install dependencies
RUN npm install

# Copy nx workspace files
COPY nx.json ./
COPY tsconfig.base.json ./
COPY tsconfig.json ./
COPY eslint.config.mjs ./

# Copy app source code
COPY apps/web ./apps/web

# Build the application
ENV NX_DAEMON=false
ENV NX_PARALLEL=1
ENV NX_SKIP_NX_CACHE=true
ENV NX_VERBOSE_LOGGING=false
# Use direct build command to avoid nx daemon issues
RUN npm run build

# Production stage
FROM node:22.14.0-slim AS runner

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init && rm -rf /var/lib/apt/lists/*

# Create a non-root user
RUN groupadd -g 1001 nodejs
RUN useradd -m -u 1001 -g nodejs nextjs

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Start the application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "apps/web/server.js"]