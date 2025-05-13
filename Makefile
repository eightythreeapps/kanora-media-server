# Makefile for Kanora Media Server

.PHONY: dev build serve test lint help clean electron electron-dev electron-build

# Development
dev: ## Start all development servers
	npx nx run-many -t serve --parallel --max-parallel=2 --projects=api,web

# Build
build: ## Build all apps
	npx nx run-many -t build --parallel --projects=api,web

serve: ## Serve the API
	npx nx serve api

# Testing
test: ## Run all tests
	npx nx run-many -t test --parallel --projects=api,web,shared-types,data-access,ui

test-watch: ## Run tests in watch mode
	npx nx run-many -t test --parallel --watch --projects=api,web,shared-types,data-access,ui

e2e: ## Run e2e tests
	npx nx run-many -t e2e --parallel --projects=api-e2e,web-e2e

# Code quality
lint: ## Lint all projects
	npx nx run-many -t lint --parallel --projects=api,web,shared-types,data-access,ui

lint-fix: ## Fix linting issues
	npx nx run-many -t lint --parallel --fix --projects=api,web,shared-types,data-access,ui

format: ## Format code
	npx nx format:write

# Electron packaging
electron-dev: ## Start Electron app in development mode
	npx nx serve desktop

electron-build: ## Build Electron app for current platform
	npx nx build desktop

electron-build-all: ## Build Electron app for all platforms
	npx nx run desktop:build:production --all

# Utility
clean: ## Clean up generated files
	npx nx reset
	rm -rf dist tmp

# Help
help: ## Display this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Default
.DEFAULT_GOAL := help 