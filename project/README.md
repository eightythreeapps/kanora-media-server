# Kanora Media Server

Kanora is a self-hosted music streaming solution with web, mobile, and VR clients. This project aims to provide a powerful, customizable alternative to commercial streaming services while giving users full control over their media library.

## Project Overview

The Kanora Media Server is built with modern web technologies:

- **Backend**: Node.js, Express, TypeScript, SQLite with Drizzle ORM
- **APIs**: RESTful APIs for authentication, library management, and media streaming
- **Clients**: Web, mobile (iOS/Android), and VR (Meta Quest) applications

## Key Features

- **User Management**: Multi-user support with authentication
- **Media Library**: Organize and browse your music collection by artists, albums, and tracks
- **Music Scanner**: Automatic metadata extraction and library organization
- **Media Streaming**: High-performance audio streaming with transcoding
- **Cross-Platform**: Access your music from any device

## Project Structure

The project follows a monorepo architecture using NX:

```
kanora-media-server/
├── apps/
│   ├── api/               # Backend server
│   ├── web/               # Web client
│   ├── mobile/            # React Native mobile app
│   └── quest-vr/          # Meta Quest VR application
├── libs/
│   └── shared-types/      # Shared TypeScript definitions
└── project/
    └── blog/              # Project documentation and blog posts
```

## Core Components

### Backend API Server

The backend server provides several key functionalities:

1. **Authentication**: JWT-based authentication system
2. **User Management**: User creation, profile management, and permissions
3. **Library Management**: Music library scanning, metadata extraction, and organization
4. **Media Streaming**: HTTP streaming with range requests, transcoding, and downloads

### Web Client

The web client offers a responsive interface for:

- Library browsing
- Music playback with playlists
- User management
- Settings configuration

### Mobile Application

The cross-platform mobile app extends the experience to iOS and Android with:

- Offline playback
- Background audio
- Mobile-optimized interface

### VR Client

The Meta Quest VR client provides an immersive listening experience with:

- Virtual listening rooms
- 3D visualizations
- Spatial audio

## Development

The project follows clean architecture principles with a focus on:

- Type safety with TypeScript
- Test-driven development
- Continuous integration
- Comprehensive documentation

### Future Plans

1. Social features (shared playlists, recommendations)
2. Smart playlists and advanced search
3. Audio analysis and visualization
4. Podcast support
5. Integration with external services

## Blog Posts

Check out our blog posts detailing the development process:

- [Implementing Media Streaming](./blog/implementing-media-streaming.md)

## License

This project is open source and available under the MIT license.
