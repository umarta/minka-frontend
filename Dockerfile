# Build stage
FROM node:20-alpine AS builder

# Use official Alpine mirrors with retry logic
RUN echo 'https://dl-cdn.alpinelinux.org/alpine/v3.18/main' > /etc/apk/repositories && \
    echo 'https://dl-cdn.alpinelinux.org/alpine/v3.18/community' >> /etc/apk/repositories

# Install dependencies needed for building with retry logic
RUN for i in 1 2 3 4 5; do \
      echo "Attempt $i to install packages..." && \
      apk update && apk add --no-cache libc6-compat && break || \
      echo "Package installation failed, retrying in 5 seconds..." && \
      sleep 5; \
    done

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS runner

# Use official Alpine mirrors with retry logic
RUN echo 'https://dl-cdn.alpinelinux.org/alpine/v3.18/main' > /etc/apk/repositories && \
    echo 'https://dl-cdn.alpinelinux.org/alpine/v3.18/community' >> /etc/apk/repositories

# Install dumb-init and wget with retry logic
RUN for i in 1 2 3 4 5; do \
      echo "Attempt $i to install packages..." && \
      apk update && apk add --no-cache dumb-init wget && break || \
      echo "Package installation failed, retrying in 5 seconds..." && \
      sleep 5; \
    done

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set working directory
WORKDIR /app

# Copy necessary files from builder
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Run the application with dumb-init
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]