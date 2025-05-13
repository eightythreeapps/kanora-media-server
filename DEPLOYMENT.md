# Kanora Media Server Deployment Guide

This guide explains how to deploy Kanora Media Server using various methods.

## Table of Contents

- [Desktop Application Deployment](#desktop-application-deployment)
- [Development Environment](#development-environment)
- [Monitoring and Observability](#monitoring-and-observability)
- [Backup and Recovery](#backup-and-recovery)
- [Troubleshooting](#troubleshooting)

## Desktop Application Deployment

Kanora Media Server is designed to be deployed as a desktop application using Electron, which wraps both the API server and web interface into a single installable package.

### How It Works

The Electron app:

1. Starts the Node.js API server in a background process
2. Opens a window that displays the web interface
3. Manages application startup, shutdown, and system integration
4. Provides access to local file system for media files

### Installation

#### Prerequisites

- Windows, macOS, or Linux operating system
- Sufficient disk space for your media library
- No additional server or database software required

#### Installation Steps

1. Download the appropriate installer for your operating system:

   - Windows: `Kanora-Setup-x.x.x.exe`
   - macOS: `Kanora-x.x.x.dmg`
   - Linux: `Kanora-x.x.x.AppImage` or distribution-specific package

2. Run the installer and follow the on-screen instructions.

3. Launch the Kanora application from your applications menu or desktop shortcut.

4. On first launch, configure your media library locations.

### Configuration

Kanora's settings are accessible through the application interface:

1. Music library location: Where your organized music collection is stored
2. Music inbox location: Where new music is placed for processing
3. Other application settings like port numbers and startup preferences

Settings are automatically saved to the application's configuration storage.

## Development Environment

### Prerequisites

- Node.js (version 20.19.0 or later)
- npm (version 9 or later)
- Nx CLI

### Setup

```bash
# Clone the repository
git clone https://github.com/eightythreeapps/kanora-media-server.git
cd kanora-media-server

# Install dependencies
npm install

# Start the development server for the API
npx nx serve api

# In another terminal, start the development server for the web interface
npx nx serve web
```

### Building the Electron App

To build the Electron desktop application during development:

```bash
# Build the API and web applications
npx nx run-many -t build --projects=api,web

# Build and run the Electron app
npx nx serve desktop
```

### Environment Configuration

Development environment variables can be configured in `.env` files:

| Variable             | Description                         | Default                         |
| -------------------- | ----------------------------------- | ------------------------------- |
| `PORT`               | The port the API server listens on  | `3333`                          |
| `DB_PATH`            | Path to the SQLite database file    | `./data/kanora.db`              |
| `JWT_SECRET`         | Secret key for JWT access tokens    | `change_this_in_production`     |
| `JWT_REFRESH_SECRET` | Secret key for JWT refresh tokens   | `change_this_too_in_production` |
| `MUSIC_INBOX_PATH`   | Path to the music inbox directory   | `./data/music/inbox`            |
| `MUSIC_LIBRARY_PATH` | Path to the music library directory | `./data/music/library`          |

## Monitoring and Observability

### Application Logs

Logs are written to the following locations:

- Windows: `%APPDATA%\Kanora\logs\`
- macOS: `~/Library/Logs/Kanora/`
- Linux: `~/.config/Kanora/logs/`

### Performance Metrics

The desktop application includes built-in performance monitoring accessible via:

1. Open the application
2. Go to Settings > Advanced > Performance Metrics

## Backup and Recovery

### Database Backup

The SQLite database can be backed up by copying the database file. Default locations:

- Windows: `%APPDATA%\Kanora\data\kanora.db`
- macOS: `~/Library/Application Support/Kanora/data/kanora.db`
- Linux: `~/.config/Kanora/data/kanora.db`

### Configuration Backup

Application settings are stored in:

- Windows: `%APPDATA%\Kanora\config.json`
- macOS: `~/Library/Application Support/Kanora/config.json`
- Linux: `~/.config/Kanora/config.json`

## Troubleshooting

### Common Issues

#### Application Won't Start

1. Check system logs for errors
2. Verify the database file isn't corrupted
3. Ensure you have read/write permissions to the application directories

#### Media Files Not Found

1. Verify the media paths in the application settings
2. Check file permissions on the media directories
3. Restart the media scanning process

### Support

For additional support:

- GitHub Issues: [Kanora Issues](https://github.com/eightythreeapps/kanora-media-server/issues)
- Documentation: [Kanora Wiki](https://github.com/eightythreeapps/kanora-media-server/wiki)
