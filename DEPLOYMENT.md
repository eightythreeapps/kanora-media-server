# Kanora Media Server Deployment Guide

This guide explains how to deploy Kanora Media Server using Docker.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (version 20.10 or later)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0 or later)

## Quick Start

The simplest way to deploy Kanora Media Server is using Docker Compose:

```bash
# Clone the repository
git clone https://github.com/eightythreeapps/kanora-media-server.git
cd kanora-media-server

# Create a .env file for Docker (copy from the example and modify as needed)
cp apps/api/src/env.example .env

# Start the containers
docker compose up -d
```

Your Kanora Media Server will be available at http://localhost:3333.

## Environment Configuration

You can customize your deployment by editing the `.env` file. Here are the important variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | The port the API server listens on | `3333` |
| `DB_PATH` | Path to the SQLite database file | `/data/kanora.db` |
| `JWT_SECRET` | Secret key for JWT access tokens | `change_this_in_production` |
| `JWT_REFRESH_SECRET` | Secret key for JWT refresh tokens | `change_this_too_in_production` |
| `MUSIC_INBOX_PATH` | Path to the music inbox directory | `/data/music/inbox` |
| `MUSIC_LIBRARY_PATH` | Path to the music library directory | `/data/music/library` |

## Volume Configuration

The Docker Compose setup uses volumes to persist data:

- `kanora-data`: Stores the SQLite database
- Host volumes for music: Maps the host machine's directories to the container's music directories

You can customize the music paths in the `.env` file:

```
MUSIC_INBOX_PATH=/path/to/your/music/inbox
MUSIC_LIBRARY_PATH=/path/to/your/music/library
```

## Production Deployment Considerations

When deploying to production, consider the following:

1. **Security**:
   - Change the JWT secret keys to strong, random values
   - Use a reverse proxy (like Nginx or Traefik) to add HTTPS

2. **Data Persistence**:
   - Use named volumes or host volumes for data persistence
   - Implement a backup strategy for the database and music files

3. **Resource Limits**:
   - Configure Docker container resource limits based on your server capacity
   - Example:
     ```yaml
     services:
       api:
         # Other config...
         deploy:
           resources:
             limits:
               cpus: '1.0'
               memory: 1G
     ```

## Monitoring

For production deployments, consider setting up monitoring:

- Use Docker's built-in health checks
- Integrate with a monitoring system like Prometheus and Grafana
- Set up log aggregation with tools like ELK stack or Loki

## Updating

To update to a new version:

```bash
# Pull the latest code
git pull

# Rebuild and restart containers
docker compose up -d --build
```

## Troubleshooting

### Container won't start

Check the logs:
```bash
docker compose logs api
```

### Database migration issues

You can run migrations manually:
```bash
docker compose exec api node /app/migrate.js
```

### Data permissions issues

Make sure your host directories have the correct permissions:
```bash
# Create directories if they don't exist
mkdir -p ./data/music/inbox ./data/music/library

# Set permissions (adjust user/group as needed)
chmod -R 777 ./data
``` 