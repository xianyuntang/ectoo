# Build stage
FROM node:22.14.0-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files from root and app
COPY package*.json ./
COPY apps/vm-monitor/package*.json ./apps/vm-monitor/

# Install dependencies
RUN npm ci

# Copy nx workspace files
COPY nx.json ./
COPY tsconfig.base.json ./
COPY tsconfig.json ./
COPY eslint.config.mjs ./

# Copy app source code
COPY apps/vm-monitor ./apps/vm-monitor

# Build the application
RUN npx nx build vm-monitor

# Production stage
FROM node:22.14.0-alpine AS runner

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create a non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/apps/vm-monitor/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/vm-monitor/.next/static ./apps/vm-monitor/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/vm-monitor/public ./apps/vm-monitor/public

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
CMD ["node", "apps/vm-monitor/server.js"]