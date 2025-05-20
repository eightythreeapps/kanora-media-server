import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import * as cuid2 from '@paralleldrive/cuid2';

// Define the artists table schema
export const artists = sqliteTable('artists', {
  id: text('id')
    .primaryKey()
    .$defaultFn(() => cuid2.createId()),
  name: text('name').notNull(),
  coverArtUrl: text('cover_art_url'),
  bio: text('bio'),
  genre: text('genre'),
  // albumCount and trackCount will be calculated dynamically or through joins
  // rather than stored directly in this table for now.
  createdAt: text('created_at').default(new Date().toISOString()), // Optional: for tracking
  updatedAt: text('updated_at').default(new Date().toISOString()), // Optional: for tracking
});

export type ArtistInsert = typeof artists.$inferInsert;
export type ArtistSelect = typeof artists.$inferSelect;
