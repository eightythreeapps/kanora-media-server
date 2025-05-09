import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { artists } from './artists';

// Define the albums table schema
export const albums = sqliteTable('albums', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  title: text('title').notNull(),
  sortTitle: text('sort_title').notNull(),
  artistId: text('artist_id').notNull().references(() => artists.id, { onDelete: 'cascade' }),
  year: integer('year'),
  coverArtPath: text('cover_art_path'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}); 