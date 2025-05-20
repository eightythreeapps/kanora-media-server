import { db } from './config';
import { users, UserRole } from './schema/users';
import { eq } from 'drizzle-orm';
import { hashPin } from '../auth/utils/pin'; // Corrected import path
// TODO: Import your actual PIN hashing function here
// import { hashPin } from '../auth/utils/pin.utils'; // Example import

const ADMIN_USERNAME = 'admin';
const ADMIN_DISPLAY_NAME = 'Admin User';
const DEFAULT_ADMIN_PIN = '1234'; // Replace with your desired default PIN

export async function seedDatabase() {
  console.log('Seeding database...');

  try {
    // Check if admin user already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.username, ADMIN_USERNAME))
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log('Admin user already exists. Skipping admin user seed.');
      // We can add other seeding logic here if needed in the future
      // For now, if admin exists, we assume seeding is done.
      return;
    }

    const hashedPin = await hashPin(DEFAULT_ADMIN_PIN); // Use hashPin

    if (!hashedPin) {
      console.error(
        'Error: PIN hash is undefined. Ensure your hashing function is working.',
      );
      return; // Or throw an error if this is critical
    }

    await db.insert(users).values({
      username: ADMIN_USERNAME,
      displayName: ADMIN_DISPLAY_NAME,
      pinHash: hashedPin, // Store the hashed PIN
      role: UserRole.ADMIN,
      // Add email if desired, or make it nullable in schema if not always present
      // email: 'admin@example.com',
    });

    console.log('Admin user seeded successfully.');

    // Placeholder for other data seeding if needed in the future
    // console.log('Seeding other necessary data...');
    // await seedOtherData();
  } catch (error) {
    console.error('Error seeding database:', error);
    // process.exit(1); // Avoid exiting in a module, let caller handle errors
    throw error; // Re-throw the error to be caught by the caller
  }
}

// Removed self-invocation: seedAdminUser().then(...).catch(...)
// The function will now be called by main.ts and auth-server.ts
