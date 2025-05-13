import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

// Define user roles as an enum
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

// Define the users table schema
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  username: text('username').notNull().unique(),
  email: text('email'),
  displayName: text('display_name').notNull(),
  pinHash: text('pin_hash'),
  role: text('role', { enum: [UserRole.USER, UserRole.ADMIN] })
    .notNull()
    .default(UserRole.USER),
  disabled: integer('disabled', { mode: 'boolean' }).notNull().default(false),
  lastLogin: text('last_login'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}); 