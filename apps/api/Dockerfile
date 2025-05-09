# Stage 1: Build the application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./
COPY nx.json ./
COPY tsconfig.base.json ./

# Copy the API app and shared libraries
COPY apps/api apps/api
COPY libs libs

# Install dependencies
RUN npm ci

# Build the application
RUN npm run build api

# Stage 2: Create the production image
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install production dependencies only
COPY --from=builder /app/dist/apps/api/package.json ./
RUN npm install --omit=dev --ignore-scripts

# Copy built application
COPY --from=builder /app/dist/apps/api ./

# Create directories for data persistence
RUN mkdir -p /data/music/inbox /data/music/library

# Set environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3333
ENV DB_PATH=/data/kanora.db
ENV MUSIC_INBOX_PATH=/data/music/inbox
ENV MUSIC_LIBRARY_PATH=/data/music/library

# Expose the API port
EXPOSE 3333

# Start the server
CMD ["node", "main.js"] 