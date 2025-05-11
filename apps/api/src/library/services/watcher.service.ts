import * as chokidar from 'chokidar';
import * as path from 'path';
import { queueService } from './queue.service';
import { db } from '../../db/config';
import { env } from '../../env';
import { createId } from '@paralleldrive/cuid2';
import { scanJobs, ScanJobStatus } from '../../db/schema/system';
import { eq } from 'drizzle-orm';

// Supported file extensions
const SUPPORTED_EXTENSIONS = ['.mp3', '.flac', '.m4a', '.ogg', '.wav'];

export class FileWatcherService {
  private watcher: chokidar.FSWatcher | null = null;
  private activeScanId: string | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;
  private pendingFiles: Set<string> = new Set();

  /**
   * Start watching the music inbox directory
   */
  async startWatching(): Promise<void> {
    try {
      // Get inbox path from env
      const inboxPath = env.MUSIC_INBOX_PATH;

      // Create a new scan job for auto-import
      const [scanJob] = await db
        .insert(scanJobs)
        .values({
          status: ScanJobStatus.PROCESSING,
          progress: 0,
          startedAt: new Date().toISOString(),
        })
        .returning();

      this.activeScanId = scanJob.id;

      // Configure and start the watcher
      this.watcher = chokidar.watch(inboxPath, {
        ignored: /(^|[/\\])\../, // Ignore dot files
        persistent: true,
        awaitWriteFinish: {
          stabilityThreshold: 2000,
          pollInterval: 100,
        },
      });

      // Setup event handlers
      this.watcher
        .on('add', (filePath) => this.handleFileAdded(filePath))
        .on('error', (error) => console.error('File watcher error:', error));

      console.log(`Started watching ${inboxPath} for new music files`);
    } catch (error) {
      console.error('Error starting file watcher:', error);
    }
  }

  /**
   * Stop watching the directory
   */
  async stopWatching(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;

      // Clear any pending files
      this.pendingFiles.clear();

      // Clear debounce timer
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
      }

      // Mark scan job as completed
      if (this.activeScanId) {
        await db
          .update(scanJobs)
          .set({
            status: ScanJobStatus.COMPLETED,
            completedAt: new Date().toISOString(),
          })
          .where(eq(scanJobs.id, this.activeScanId));

        this.activeScanId = null;
      }

      console.log('Stopped watching for new music files');
    }
  }

  /**
   * Handle a new file being added to the watched directory
   */
  private handleFileAdded(filePath: string): void {
    // Check if it's a supported audio file
    if (this.isAudioFile(filePath)) {
      // Add to pending files
      this.pendingFiles.add(filePath);

      // Debounce processing to avoid rapid-fire events
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      this.debounceTimer = setTimeout(() => {
        this.processPendingFiles();
      }, 3000); // 3 second debounce
    }
  }

  /**
   * Process all pending files
   */
  private async processPendingFiles(): Promise<void> {
    if (this.pendingFiles.size === 0) return;

    // If we don't have an active scan ID, create one
    if (!this.activeScanId) {
      const [scanJob] = await db
        .insert(scanJobs)
        .values({
          status: ScanJobStatus.PROCESSING,
          progress: 0,
          startedAt: new Date().toISOString(),
        })
        .returning();

      this.activeScanId = scanJob.id;
    }

    // Queue each file for import
    const scanId = this.activeScanId;
    const filesToProcess = Array.from(this.pendingFiles);

    for (const filePath of filesToProcess) {
      await queueService.queueFileImport(scanId, filePath);
      this.pendingFiles.delete(filePath);
    }

    console.log(`Queued ${filesToProcess.length} files for import`);
  }

  /**
   * Check if a file is a supported audio file
   */
  private isAudioFile(filePath: string): boolean {
    const extension = path.extname(filePath).toLowerCase();
    return SUPPORTED_EXTENSIONS.includes(extension);
  }
}

// Export singleton instance
export const fileWatcherService = new FileWatcherService();
