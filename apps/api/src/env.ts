import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
const envPath = path.resolve(process.cwd(), 'apps/api/.env');
const exampleEnvPath = path.resolve(process.cwd(), 'apps/api/src/env.example');

// If .env doesn't exist but example does, copy example to .env
if (!fs.existsSync(envPath) && fs.existsSync(exampleEnvPath)) {
  fs.copyFileSync(exampleEnvPath, envPath);
  console.log('Created .env file from example.');
}

// Load environment variables
dotenv.config({ path: envPath });

// Define environment variables interface
export interface Env {
  PORT: number;
  HOST: string;
  NODE_ENV: 'development' | 'production' | 'test';
  DB_PATH: string;
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  JWT_ACCESS_EXPIRES_IN: string;
  JWT_REFRESH_EXPIRES_IN: string;
  MUSIC_INBOX_PATH: string;
  MUSIC_LIBRARY_PATH: string;
  REDIS_HOST?: string;
  REDIS_PORT?: string;
  QUEUE_CONCURRENCY?: string;
}

// Define and export environment object with defaults
export const env: Env = {
  PORT: parseInt(process.env.PORT || '3333', 10),
  HOST: process.env.HOST || 'localhost',
  NODE_ENV: (process.env.NODE_ENV as Env['NODE_ENV']) || 'development',
  DB_PATH: process.env.DB_PATH || './data/kanora.db',
  JWT_SECRET: process.env.JWT_SECRET || 'dev-jwt-secret',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
  JWT_ACCESS_EXPIRES_IN: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  MUSIC_INBOX_PATH: process.env.MUSIC_INBOX_PATH || './data/music/inbox',
  MUSIC_LIBRARY_PATH: process.env.MUSIC_LIBRARY_PATH || './data/music/library',
  REDIS_HOST: process.env.REDIS_HOST,
  REDIS_PORT: process.env.REDIS_PORT,
  QUEUE_CONCURRENCY: process.env.QUEUE_CONCURRENCY,
};

// Function to validate required environment variables
export function validateEnv(): void {
  const requiredVars = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    console.warn(`Missing required environment variables: ${missingVars.join(', ')}`);
    
    if (env.NODE_ENV === 'production') {
      throw new Error('Missing required environment variables for production.');
    }
  }
} 