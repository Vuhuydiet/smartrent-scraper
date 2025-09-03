# Use Node.js official image
FROM node:20.18.1-alpine AS base

# Set working directory
WORKDIR /app

# Install system dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    && rm -rf /var/cache/apk/*

# Tell Puppeteer to skip installing Chromium. We'll be using the installed package.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy package files
COPY package*.json ./

# Install dependencies
FROM base AS dependencies
RUN npm ci --only=production

# Development stage
FROM base AS development
RUN npm ci
COPY . .
RUN npm run db:generate
RUN npm run build
CMD ["npm", "run", "dev"]

# Production build stage
FROM base AS build
RUN npm ci
COPY . .
RUN npm run db:generate
RUN npm run build

# Production stage
FROM base AS production

# Copy node_modules from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules

# Copy built application
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S scraper -u 1001

# Create necessary directories and set permissions
RUN mkdir -p /app/logs /app/data /app/tmp && \
    chown -R scraper:nodejs /app

# Switch to non-root user
USER scraper

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]
