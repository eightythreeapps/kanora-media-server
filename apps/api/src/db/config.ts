import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { env } from '../env';
import * as schema from './schema';

// Ensure data directory exists
const DATA_DIR = env.DB_PATH
  ? path.dirname(env.DB_PATH)
  : path.resolve(process.cwd(), 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Create SQLite database connection
const sqlite = new Database(env.DB_PATH);

// Create Drizzle ORM instance with schema
export const db = drizzle(sqlite, { schema });

// Run migrations (if any)
export const runMigrations = () => {
  // Try multiple possible migration directories
  const possibleMigrationDirs = [
    path.join(__dirname, 'migrations'), // Development path
    path.resolve(process.cwd(), 'migrations'), // Docker container path
    path.resolve(process.cwd(), 'apps/api/src/db/migrations'), // Project root path
  ];

  // Find the first migration directory that exists
  const MIGRATIONS_DIR = possibleMigrationDirs.find((dir) =>
    fs.existsSync(dir),
  );

  if (MIGRATIONS_DIR) {
    console.log(`Running database migrations from ${MIGRATIONS_DIR}...`);
    migrate(db, { migrationsFolder: MIGRATIONS_DIR });
    console.log('Migrations completed.');
  } else {
    console.log('No migrations directory found. Skipping migrations.');
    console.log('Searched in:', possibleMigrationDirs);
  }
};
