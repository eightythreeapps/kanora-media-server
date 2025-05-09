# Use Node.js as the base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Create directories for data persistence
RUN mkdir -p /data/music/inbox /data/music/library

# Copy the entire pre-built API directory
COPY dist/apps/api/ ./

# Copy migrations
COPY apps/api/src/db/migrations ./migrations

# Install only production dependencies
RUN npm install --omit=dev --legacy-peer-deps

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