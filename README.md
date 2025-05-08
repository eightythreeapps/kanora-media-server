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

### Database Setup

```bash
# Generate migrations (if schema changed)
npm run db:generate

# Apply migrations
npm run db:migrate

# Seed the database with initial data
npm run db:seed

# Explore the database with Drizzle Studio
npm run db:studio
```

## Deployment

Kanora can be deployed using Docker:

```bash
# Build and start the containers
docker compose up -d
```

## Nx Workspace

This project is built using [Nx](https://nx.dev), a smart, fast and extensible build system.

### Run tasks

To run tasks with Nx use:

```sh
npx nx <target> <project-name>
```

For example:

```sh
npx nx build api
```

### Available Commands

- `npm run dev`: Start the development server
- `npm run build`: Build all projects
- `npm run test`: Run tests
- `npm run lint`: Run linting

## License

MIT
