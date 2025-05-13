import { db } from '../config';
import { env } from '../../env';
import { users, UserRole } from '../schema/users';
import { systemSettings } from '../schema/system';
import { createId } from '@paralleldrive/cuid2';
import * as crypto from 'crypto';
import { eq } from 'drizzle-orm';

// Function to hash PIN
function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(pin, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export async function seedDatabase() {
  console.log('Seeding database...');

  // Check if system settings exist
  const existingSettings = await db.select().from(systemSettings).limit(1);
  
  if (existingSettings.length === 0) {
    console.log('Creating default system settings...');
    await db.insert(systemSettings).values({
      id: createId(),
      musicInboxPath: env.MUSIC_INBOX_PATH,
      musicLibraryPath: env.MUSIC_LIBRARY_PATH,
      enableTranscoding: true,
      autoOrganize: true,
      updatedAt: new Date().toISOString(),
    });
  }

  // Check if admin user exists
  const existingAdmin = await db.select().from(users).where(eq(users.role, UserRole.ADMIN)).limit(1);
  
  if (existingAdmin.length === 0) {
    console.log('Creating default admin user...');
    await db.insert(users).values({
      id: createId(),
      username: 'admin',
      email: 'admin@kanora.local',
      displayName: 'Admin',
      pinHash: hashPin('1234'), // Default PIN - change this in production
      role: UserRole.ADMIN,
      disabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  console.log('Database seeded successfully.');
}

// Run the seed if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seed completed successfully.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Error seeding database:', error);
      process.exit(1);
    });
} 