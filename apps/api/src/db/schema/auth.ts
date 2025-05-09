import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

// Define the revoked tokens table schema
export const revokedTokens = sqliteTable('revoked_tokens', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  jti: text('jti').notNull().unique(),
  userId: text('user_id').notNull(),
  expiresAt: text('expires_at').notNull(),
  revokedAt: text('revoked_at').notNull().$defaultFn(() => new Date().toISOString()),
}); 