import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { ApiResponse } from '@kanora/shared-types';
import { env, validateEnv } from './env';
import { runMigrations } from './db/config';
import { seedDatabase } from './db/seed';
import authRoutes from './auth/routes/authRoutes';
import userRoutes from './users/routes/userRoutes';
import { cleanupRevokedTokens } from './auth/utils/jwt';

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

// API routes
app.get('/', (req, res) => {
  res.json({
    name: 'Kanora Media Server API (Auth Only)',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint for monitoring and Docker health checks
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '0.1.0',
    environment: env.NODE_ENV,
  });
});

// Mock media endpoint to make the UI happy
app.get('/api/media', (req, res) => {
  const response: ApiResponse<[]> = {
    success: true,
    data: [],
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

async function startServer() {
  try {
    // First initialize the database
    await initializeDatabase();

    // Periodically clean up revoked tokens (every hour)
    setInterval(cleanupRevokedTokens, 60 * 60 * 1000);

    // Start the server
    const port = env.PORT || 3333;
    app.listen(port, () => {
      console.log(
        `Kanora Auth Server API is listening at http://localhost:${port}`,
      );
      console.log(`Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Only start the server if this file is run directly
if (require.main === module) {
  startServer();
}

export default app;
