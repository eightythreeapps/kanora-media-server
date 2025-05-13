const Database = require('better-sqlite3');
const { createId } = require('@paralleldrive/cuid2');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Ensure data directory exists
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Database file path
const DB_PATH = path.join(DATA_DIR, 'kanora.db');

// Create database connection
const db = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Define user roles
const UserRole = {
  USER: 'user',
  ADMIN: 'admin',
};

// Function to hash PIN
function hashPin(pin) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(pin, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// Define music paths
const MUSIC_INBOX_PATH = process.env.MUSIC_INBOX_PATH || './data/music/inbox';
const MUSIC_LIBRARY_PATH = process.env.MUSIC_LIBRARY_PATH || './data/music/library';

// Ensure music directories exist
if (!fs.existsSync(MUSIC_INBOX_PATH)) {
  fs.mkdirSync(MUSIC_INBOX_PATH, { recursive: true });
}

if (!fs.existsSync(MUSIC_LIBRARY_PATH)) {
  fs.mkdirSync(MUSIC_LIBRARY_PATH, { recursive: true });
}

function seedDatabase() {
  console.log('Seeding database...');

  try {
    // Start a transaction
    db.prepare('BEGIN TRANSACTION').run();

    // Check if system settings exist
    const existingSettings = db.prepare('SELECT count(*) as count FROM system_settings').get();
    
    if (existingSettings.count === 0) {
      console.log('Creating default system settings...');
      db.prepare(`
        INSERT INTO system_settings (id, music_inbox_path, music_library_path, enable_transcoding, auto_organize, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        createId(),
        MUSIC_INBOX_PATH,
        MUSIC_LIBRARY_PATH,
        1,
        1,
        new Date().toISOString()
      );
    }

    // Check if admin user exists
    const existingAdmin = db.prepare('SELECT count(*) as count FROM users WHERE role = ?').get(UserRole.ADMIN);
    
    if (existingAdmin.count === 0) {
      console.log('Creating default admin user...');
      db.prepare(`
        INSERT INTO users (id, username, email, display_name, pin_hash, role, disabled, created_at, updated_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        createId(),
        'admin',
        'admin@kanora.local',
        'Admin',
        hashPin('1234'), // Default PIN is 1234
        UserRole.ADMIN,
        0,
        new Date().toISOString(),
        new Date().toISOString()
      );
    }

    // Commit the transaction
    db.prepare('COMMIT').run();
    console.log('Database seeded successfully.');
  } catch (error) {
    // Rollback in case of error
    db.prepare('ROLLBACK').run();
    console.error('Error in seed operation:', error);
    throw error;
  } finally {
    // Close the database connection
    db.close();
  }
}

// Run the seed
try {
  seedDatabase();
  console.log('Seed completed successfully.');
  process.exit(0);
} catch (error) {
  console.error('Error seeding database:', error);
  process.exit(1);
} 