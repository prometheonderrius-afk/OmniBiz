# Production Dockerfile for GCP Cloud Run
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application source code
COPY . .

# Build Vite static assets
RUN npm run build

# Production Runner Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY package*.json ./
RUN npm ci --only=production

# Copy built assets and server from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/api ./api
COPY --from=builder /app/server.js ./server.js

EXPOSE 8080

CMD ["node", "server.js"]
