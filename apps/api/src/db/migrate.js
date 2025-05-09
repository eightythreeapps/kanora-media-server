const Database = require('better-sqlite3');
const { drizzle } = require('drizzle-orm/better-sqlite3');
const { migrate } = require('drizzle-orm/better-sqlite3/migrator');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Database file path
const DB_PATH = path.join(DATA_DIR, 'kanora.db');

// Create database connection
const sqlite = new Database(DB_PATH);
const db = drizzle(sqlite);

// Run migrations
const MIGRATIONS_DIR = path.resolve(process.cwd(), 'apps/api/src/db/migrations');

if (fs.existsSync(MIGRATIONS_DIR)) {
  console.log('Running database migrations...');
  migrate(db, { migrationsFolder: MIGRATIONS_DIR });
  console.log('Migrations completed successfully.');
} else {
  console.log('No migrations directory found. Skipping migrations.');
}

console.log('Database is ready.');
process.exit(0); 