import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import {
  MediaType,
  ApiResponse,
  Media,
  PaginatedResponse,
} from '@kanora/shared-types';
import { env, validateEnv } from './env';
import { db, runMigrations } from './db/config';
import { seedDatabase } from './db/seed';
import authRoutes from './auth/routes/authRoutes';
import userRoutes from './users/routes/userRoutes';
import libraryRoutes from './library/routes/library.routes';
import scannerRoutes from './library/routes/scanner.routes';
import { cleanupRevokedTokens } from './auth/utils/jwt';
import { fileWatcherService } from './library/services/watcher.service';

// Validate environment variables
validateEnv();

// Initialize the application
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Auth routes
app.use('/auth', authRoutes);

// User management routes
app.use('/api', userRoutes);

// Library routes
app.use('/api/library', libraryRoutes);

// Library scanner routes
app.use('/api/library', scannerRoutes);

// Sample data (in-memory database for demo)
const mediaItems: Media[] = [
  {
    id: '1',
    title: 'Big Buck Bunny',
    description:
      'A short animated film featuring a giant rabbit dealing with bullies',
    type: MediaType.MOVIE,
    path: '/media/movies/big_buck_bunny.mp4',
    fileSize: 158008374,
    dateAdded: new Date().toISOString(),
    dateModified: new Date().toISOString(),
    duration: 596,
    thumbnailPath:
      'https://peach.blender.org/wp-content/uploads/title_anouncement.jpg',
    metadata: {
      resolution: '1080p',
      codec: 'H.264',
    },
  },
  {
    id: '2',
    title: 'Sintel',
    description: 'A short film about a girl searching for her dragon friend',
    type: MediaType.MOVIE,
    path: '/media/movies/sintel.mp4',
    fileSize: 187670548,
    dateAdded: new Date().toISOString(),
    dateModified: new Date().toISOString(),
    duration: 888,
    thumbnailPath:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Sintel_poster.jpg/800px-Sintel_poster.jpg',
    metadata: {
      resolution: '4K',
      codec: 'H.265',
    },
  },
];

// API routes
app.get('/', (req, res) => {
  res.json({
    name: 'Kanora Media Server API',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint for monitoring and Docker health checks
app.get('/health', (req, res) => {
  // Check database connection
  try {
    // Simple health check that doesn't rely on database query
    // Just checking if the server is running and responding
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: '0.1.0',
      environment: env.NODE_ENV,
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
});

// Get all media
app.get('/api/media', (req, res) => {
  const response: ApiResponse<Media[]> = {
    success: true,
    data: mediaItems,
    timestamp: new Date().toISOString(),
  };
  res.json(response);
});

// Get media by ID
app.get('/api/media/:id', (req, res) => {
  const { id } = req.params;
  const media = mediaItems.find((item) => item.id === id);

  if (!media) {
    const response: ApiResponse<null> = {
      success: false,
      error: 'Media not found',
      timestamp: new Date().toISOString(),
    };
    return res.status(404).json(response);
  }

  const response: ApiResponse<Media> = {
    success: true,
    data: media,
    timestamp: new Date().toISOString(),
  };
  res.json(response);
});

// Search media
app.post('/api/media/search', (req, res) => {
  const { term, types, page = 1, pageSize = 10 } = req.body;

  let filtered = [...mediaItems];

  // Filter by search term
  if (term) {
    const lowerTerm = term.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerTerm) ||
        (item.description &&
          item.description.toLowerCase().includes(lowerTerm)),
    );
  }

  // Filter by media types
  if (types && types.length > 0) {
    filtered = filtered.filter((item) => types.includes(item.type));
  }

  // Pagination
  const startIndex = (page - 1) * pageSize;
  const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);

  const response: ApiResponse<PaginatedResponse<Media>> = {
    success: true,
    data: {
      items: paginatedItems,
      totalItems: filtered.length,
      page,
      pageSize,
      totalPages: Math.ceil(filtered.length / pageSize),
    },
    timestamp: new Date().toISOString(),
  };

  res.json(response);
});

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error(err.stack);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Internal Server Error',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  },
);

// Initialize database
async function initializeDatabase() {
  try {
    // Run database migrations
    runMigrations();

    // Seed the database with initial data
    await seedDatabase();

    console.log('Database initialized successfully.');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

// Start the server
async function startServer() {
  // Initialize database first
  await initializeDatabase();

  // Setup periodic cleanup of revoked tokens
  // Run every hour
  setInterval(
    async () => {
      try {
        await cleanupRevokedTokens();
        console.log('Cleaned up expired revoked tokens');
      } catch (error) {
        console.error('Error cleaning up revoked tokens:', error);
      }
    },
    60 * 60 * 1000,
  ); // Every hour

  // Start the file watcher for the music inbox
  try {
    await fileWatcherService.startWatching();
    console.log(`Started watching ${env.MUSIC_INBOX_PATH} for new music files`);
  } catch (error) {
    console.error('Error starting file watcher:', error);
  }

  // Start listening for requests
  app.listen(env.PORT, env.HOST, () => {
    console.log(`[ Kanora API ] http://${env.HOST}:${env.PORT}`);
    console.log('Environment:', env.NODE_ENV);
  });
}

// Start the application
startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
