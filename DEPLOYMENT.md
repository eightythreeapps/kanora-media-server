# Kanora Media Server Deployment Guide

This guide explains how to deploy Kanora Media Server using various methods.

## Table of Contents

- [Local Docker Deployment](#local-docker-deployment)
- [Production Deployment Options](#production-deployment-options)
- [Cloud Deployment](#cloud-deployment)
- [Scaling Considerations](#scaling-considerations)
- [Monitoring and Observability](#monitoring-and-observability)
- [Backup and Recovery](#backup-and-recovery)
- [Troubleshooting](#troubleshooting)

## Local Docker Deployment

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (version 20.10 or later)
- [Docker Compose](https://docs.docker.com/compose/install/) (version 2.0 or later)

### Quick Start

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

### Using Makefile Commands

We provide a Makefile to simplify Docker operations:

```bash
# Build the images
make build

# Start the containers in detached mode
make up

# Start the containers in foreground mode (with logs)
make dev

# View logs
make logs

# Stop containers
make down

# Seed the database with initial data
make seed

# Clean up resources
make clean
```

### Environment Configuration

You can customize your deployment by editing the `.env` file. Here are the important variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | The port the API server listens on | `3333` |
| `DB_PATH` | Path to the SQLite database file | `/data/kanora.db` |
| `JWT_SECRET` | Secret key for JWT access tokens | `change_this_in_production` |
| `JWT_REFRESH_SECRET` | Secret key for JWT refresh tokens | `change_this_too_in_production` |
| `MUSIC_INBOX_PATH` | Path to the music inbox directory | `/data/music/inbox` |
| `MUSIC_LIBRARY_PATH` | Path to the music library directory | `/data/music/library` |

### Volume Configuration

The Docker Compose setup uses volumes to persist data:

- `kanora-data`: Stores the SQLite database
- Host volumes for music: Maps the host machine's directories to the container's music directories

You can customize the music paths in the `.env` file:

```
MUSIC_INBOX_PATH=/path/to/your/music/inbox
MUSIC_LIBRARY_PATH=/path/to/your/music/library
```

## Production Deployment Options

When deploying to production, consider the following:

### Self-Hosted Deployment

1. **Security**:
   - Change the JWT secret keys to strong, random values
   - Use a reverse proxy (like Nginx or Traefik) to add HTTPS
   - Consider using Let's Encrypt for free SSL certificates
   - Implement proper firewall rules

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

4. **Reverse Proxy Configuration**:

   Example Nginx configuration:
   ```nginx
   server {
       listen 80;
       server_name music.yourdomain.com;
       
       # Redirect to HTTPS
       location / {
           return 301 https://$host$request_uri;
       }
   }

   server {
       listen 443 ssl;
       server_name music.yourdomain.com;

       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;

       # API proxy
       location /api/ {
           proxy_pass http://localhost:3333/api/;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # Web client (when implemented)
       location / {
           proxy_pass http://localhost:4200/;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## Cloud Deployment

### Docker Registry

The Kanora Media Server images are published to GitHub Container Registry. You can use them directly:

```bash
docker pull ghcr.io/eightythreeapps/kanora-media-server/api:latest
```

### Deploying to AWS

1. **Using EC2**:
   - Launch an EC2 instance with Docker installed
   - Clone the repository and run the Docker Compose setup as described above
   - Use an Elastic IP for a static address
   - Configure security groups to expose only necessary ports

2. **Using ECS (Elastic Container Service)**:
   - Create an ECS cluster
   - Define a task definition using the Kanora API container
   - Set up an ECS service to run the task
   - Use EFS (Elastic File System) for persistent storage
   - Add an Application Load Balancer for HTTPS termination

   Example `ecs-task-definition.json`:
   ```json
   {
     "family": "kanora-api",
     "executionRoleArn": "arn:aws:iam::account-id:role/ecsTaskExecutionRole",
     "networkMode": "awsvpc",
     "containerDefinitions": [
       {
         "name": "kanora-api",
         "image": "ghcr.io/eightythreeapps/kanora-media-server/api:latest",
         "essential": true,
         "portMappings": [
           {
             "containerPort": 3333,
             "hostPort": 3333,
             "protocol": "tcp"
           }
         ],
         "environment": [
           { "name": "NODE_ENV", "value": "production" },
           { "name": "PORT", "value": "3333" }
         ],
         "secrets": [
           { "name": "JWT_SECRET", "valueFrom": "arn:aws:ssm:region:account-id:parameter/kanora/jwt-secret" }
         ],
         "mountPoints": [
           {
             "sourceVolume": "kanora-data",
             "containerPath": "/data",
             "readOnly": false
           }
         ],
         "logConfiguration": {
           "logDriver": "awslogs",
           "options": {
             "awslogs-group": "/ecs/kanora-api",
             "awslogs-region": "us-west-2",
             "awslogs-stream-prefix": "ecs"
           }
         }
       }
     ],
     "volumes": [
       {
         "name": "kanora-data",
         "efsVolumeConfiguration": {
           "fileSystemId": "fs-1234567",
           "rootDirectory": "/"
         }
       }
     ],
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "256",
     "memory": "512"
   }
   ```

### Deploying to Google Cloud

1. **Using GCE (Google Compute Engine)**:
   - Create a VM instance with Docker installed
   - Follow the standard Docker Compose deployment steps

2. **Using GKE (Google Kubernetes Engine)**:
   - Create a GKE cluster
   - Deploy the Kanora API using Kubernetes manifests
   - Use Persistent Volumes for data storage

   Example Kubernetes deployment:
   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: kanora-api
   spec:
     replicas: 1
     selector:
       matchLabels:
         app: kanora-api
     template:
       metadata:
         labels:
           app: kanora-api
       spec:
         containers:
         - name: kanora-api
           image: ghcr.io/eightythreeapps/kanora-media-server/api:latest
           ports:
           - containerPort: 3333
           env:
           - name: NODE_ENV
             value: "production"
           volumeMounts:
           - name: kanora-data
             mountPath: /data
         volumes:
         - name: kanora-data
           persistentVolumeClaim:
             claimName: kanora-data-pvc
   ```

## Scaling Considerations

Kanora Media Server uses SQLite for its database, which has limitations for horizontal scaling. Consider the following:

### Vertical Scaling

- Increase CPU and memory resources for the container
- Use faster storage for the database and media files

### Distributed Setup

For larger deployments, consider:
- Separating the database into a dedicated service (e.g., PostgreSQL)
- Using a distributed file system or object storage for media files
- Implementing a caching layer with Redis
- Setting up a load balancer for multiple API instances

## Monitoring and Observability

For production deployments, implement:

### Health Checks

In your Docker Compose file:
```yaml
services:
  api:
    # Other config...
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3333/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

### Monitoring Tools

- Use Docker's built-in health checks
- Integrate with a monitoring system like Prometheus and Grafana
- Set up log aggregation with tools like ELK stack or Loki
- Consider using application performance monitoring (APM) solutions

### Alerting

- Set up alerts for critical events:
  - Service downtime
  - High resource usage
  - Error rate spikes
  - Disk space running low

## Backup and Recovery

Implement a robust backup strategy:

1. **Database Backups**:
   ```bash
   # Create a backup script
   docker compose exec api sh -c "sqlite3 /data/kanora.db .dump > /data/backup/kanora-$(date +%Y%m%d).sql"
   ```

2. **Media Backups**:
   - Regularly back up the music library to external storage
   - Consider incremental backups for large libraries

3. **Automated Backup Schedule**:
   - Use cron jobs to schedule regular backups
   - Implement retention policies for old backups

4. **Recovery Testing**:
   - Periodically test restoring from backups
   - Document the recovery procedure

## Updating

To update to a new version:

```bash
# Pull the latest code
git pull

# Rebuild and restart containers
docker compose up -d --build
```

For production updates, consider:
- Testing updates in a staging environment first
- Using blue-green deployment strategies
- Having a rollback plan

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

### Network connectivity issues

Check that ports are correctly published:
```bash
docker compose ps
```

Verify that no other services are using the same ports:
```bash
netstat -tulpn | grep 3333
``` 