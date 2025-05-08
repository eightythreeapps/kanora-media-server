# Kanora Media Server

Kanora is a modern self-hosted music streaming solution with web, mobile, and VR clients.

## Features

- **Authentication & User Management**: Secure login, token-based authentication, and user roles.
- **Music Library Management**: Automatic scanning, metadata extraction, and organization.
- **Streaming**: Range-based streaming with optional transcoding for mobile devices.
- **Client Applications**: Web, mobile (iOS/Android), and VR (Meta Quest) interfaces.
- **Playlist Management**: Create, edit, and share your music collections.

## Project Structure

Kanora uses a monorepo architecture with the following components:

- `/apps/api`: Backend server (Node.js, Express, TypeScript)
- `/apps/web`: Web client (Next.js, React)
- `/apps/mobile`: Mobile client (React Native, Expo)
- `/apps/vr`: VR client for Meta Quest (Three.js)
- `/libs/shared-types`: Shared TypeScript definitions
- `/libs/data-access`: Shared data access layer
- `/libs/ui`: Shared UI components

## Development

### Prerequisites

- Node.js (v18+)
- npm or yarn
- ffmpeg (for transcoding)

### Setup

```bash
# Clone the repository
git clone https://github.com/eightythreeapps/kanora-media-server.git
cd kanora-media-server

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Deployment

Kanora can be deployed using Docker:

```bash
# Build and start the containers
docker compose up -d
```

## License

MIT