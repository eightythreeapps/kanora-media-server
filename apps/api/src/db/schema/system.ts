import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { createId } from '@paralleldrive/cuid2';

// Define scan job status enum
export enum ScanJobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// Define the scan jobs table schema
export const scanJobs = sqliteTable('scan_jobs', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  status: text('status', { enum: ['pending', 'processing', 'completed', 'failed'] })
    .notNull()
    .default(ScanJobStatus.PENDING),
  progress: integer('progress').notNull().default(0),
  currentFile: text('current_file'),
  totalFiles: integer('total_files'),
  processedFiles: integer('processed_files').notNull().default(0),
  errorCount: integer('error_count').notNull().default(0),
  startedAt: text('started_at').notNull().$defaultFn(() => new Date().toISOString()),
  completedAt: text('completed_at'),
});

// Define the system settings table schema
export const systemSettings = sqliteTable('system_settings', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  musicInboxPath: text('music_inbox_path').notNull(),
  musicLibraryPath: text('music_library_path').notNull(),
  enableTranscoding: integer('enable_transcoding', { mode: 'boolean' }).notNull().default(true),
  autoOrganize: integer('auto_organize', { mode: 'boolean' }).notNull().default(true),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}); 