import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';
import { env } from '../env';

// Ensure data directory exists
const DATA_DIR = env.DB_PATH 
  ? path.dirname(env.DB_PATH)
  : path.resolve(process.cwd(), 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Create SQLite database connection
const sqlite = new Database(env.DB_PATH);

// Create Drizzle ORM instance
export const db = drizzle(sqlite);

// Run migrations (if any)
export const runMigrations = () => {
  const MIGRATIONS_DIR = path.join(__dirname, 'migrations');
  
  if (fs.existsSync(MIGRATIONS_DIR)) {
    console.log('Running database migrations...');
    migrate(db, { migrationsFolder: MIGRATIONS_DIR });
    console.log('Migrations completed.');
  } else {
    console.log('No migrations directory found. Skipping migrations.');
  }
}; 