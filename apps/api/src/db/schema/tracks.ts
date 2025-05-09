import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';
import { artists } from './artists';
import { albums } from './albums';

// Define the tracks table schema
export const tracks = sqliteTable('tracks', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  title: text('title').notNull(),
  sortTitle: text('sort_title').notNull(),
  albumId: text('album_id').notNull().references(() => albums.id, { onDelete: 'cascade' }),
  artistId: text('artist_id').notNull().references(() => artists.id, { onDelete: 'cascade' }),
  trackNumber: integer('track_number'),
  discNumber: integer('disc_number'),
  duration: integer('duration').notNull(),
  path: text('path').notNull(),
  format: text('format').notNull(),
  bitrate: integer('bitrate'),
  fileSize: integer('file_size').notNull(),
  contentHash: text('content_hash').notNull().unique(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}); 