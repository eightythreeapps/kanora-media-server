import { runMigrations } from './config';
import { validateEnv } from '../env';

// Validate environment variables
validateEnv();

// Run migrations
runMigrations();

console.log('Migration completed successfully.');
process.exit(0); 