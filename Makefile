.PHONY: build-api build up down restart logs clean dev seed

# Build the API
build-api:
	npm run build api

# Build the Docker images
build: build-api
	docker compose build

# Start the Docker containers in detached mode
up: build
	docker compose up -d

# Start the Docker containers in foreground mode (useful for development)
dev: build
	docker compose up

# Stop the Docker containers
down:
	docker compose down

# Restart the containers
restart:
	docker compose restart

# Show container logs
logs:
	docker compose logs -f

# Seed the database
seed:
	docker compose exec api node /app/seed.js

# Clean up Docker resources
clean:
	docker compose down --volumes --remove-orphans
	docker system prune -f

# Show this help message
help:
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  build-api Build just the API"
	@echo "  build     Build the Docker images (includes building API)"
	@echo "  up        Start the Docker containers in detached mode"
	@echo "  dev       Start the Docker containers in foreground mode"
	@echo "  down      Stop the Docker containers"
	@echo "  restart   Restart the containers"
	@echo "  logs      Show container logs"
	@echo "  seed      Seed the database"
	@echo "  clean     Clean up Docker resources"
	@echo "  help      Show this help message"

# Default target
.DEFAULT_GOAL := help 