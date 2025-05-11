import { Queue, Worker, Job } from 'bullmq';
import { env } from '../../env';
import path from 'path';
import os from 'os';
import { db } from '../../db/config';
import { scanJobs, ScanJobStatus } from '../../db/schema/system';
import { eq } from 'drizzle-orm';
import { LibraryScannerService } from './scanner.service';

// Job types
export enum JobType {
  SCAN_LIBRARY = 'scanLibrary',
  IMPORT_FILE = 'importFile',
}

// Job data interfaces
export interface ScanLibraryJobData {
  scanId: string;
  paths: string[];
}

export interface ImportFileJobData {
  scanId: string;
  filePath: string;
}

// Queue configuration
const QUEUE_NAME = 'library';
const DEFAULT_CONCURRENCY = 1;

// Create queue connection options
const connectionOptions = {
  connection: {
    host: env.REDIS_HOST || 'localhost',
    port: env.REDIS_PORT ? parseInt(env.REDIS_PORT) : 6379,
    // If we're in development environment, use inmemory storage instead of redis
    ...(env.NODE_ENV === 'development' && {
      enableOfflineQueue: true,
      lazyConnect: true,
    }),
  },
};

export class QueueService {
  private queue: Queue;
  private scannerService: LibraryScannerService;
  private workers: Worker[] = [];

  constructor() {
    // Initialize the queue
    this.queue = new Queue(QUEUE_NAME, connectionOptions);

    // Initialize the scanner service
    this.scannerService = new LibraryScannerService();

    // Start workers
    this.initWorkers();
  }

  private initWorkers() {
    // Create worker for processing jobs
    const concurrency = env.QUEUE_CONCURRENCY
      ? parseInt(env.QUEUE_CONCURRENCY)
      : DEFAULT_CONCURRENCY;

    const worker = new Worker(
      QUEUE_NAME,
      async (job: Job) => {
        await this.processJob(job);
      },
      {
        ...connectionOptions,
        concurrency,
      },
    );

    worker.on('completed', (job) => {
      console.log(`Job ${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
      console.error(`Job ${job?.id} failed with error: ${err.message}`);

      // Update job status in database if it's a scan job
      if (job?.data?.scanId) {
        this.updateScanJobStatus(job.data.scanId, ScanJobStatus.FAILED);
      }
    });

    this.workers.push(worker);
  }

  private async processJob(job: Job) {
    const { name, data } = job;

    switch (name) {
      case JobType.SCAN_LIBRARY:
        await this.processScanLibraryJob(data as ScanLibraryJobData);
        break;
      case JobType.IMPORT_FILE:
        await this.processImportFileJob(data as ImportFileJobData);
        break;
      default:
        throw new Error(`Unknown job type: ${name}`);
    }
  }

  private async processScanLibraryJob(data: ScanLibraryJobData) {
    const { scanId, paths } = data;

    try {
      // Update job status to processing
      await this.updateScanJobStatus(scanId, ScanJobStatus.PROCESSING);

      // Execute the scan
      await this.scannerService.scanLibrary(scanId, paths);

      // Update job status to completed
      await this.updateScanJobStatus(scanId, ScanJobStatus.COMPLETED);
    } catch (error) {
      console.error(`Error processing scan job ${scanId}:`, error);

      // Update job status to failed
      await this.updateScanJobStatus(scanId, ScanJobStatus.FAILED);

      // Rethrow to trigger the failed event
      throw error;
    }
  }

  private async processImportFileJob(data: ImportFileJobData) {
    const { scanId, filePath } = data;

    try {
      // Process single file import
      await this.scannerService.importFile(scanId, filePath);
    } catch (error) {
      console.error(`Error importing file ${filePath}:`, error);

      // Increment error count in scan job
      await this.incrementScanJobErrorCount(scanId);

      // Rethrow to trigger the failed event
      throw error;
    }
  }

  // Queue a library scan job
  async queueLibraryScan(
    paths: string[] = [path.join(os.homedir(), 'Music')],
  ): Promise<string> {
    // Create a new scan job in the database
    const [scanJob] = await db
      .insert(scanJobs)
      .values({
        status: ScanJobStatus.PENDING,
        progress: 0,
        startedAt: new Date().toISOString(),
      })
      .returning();

    // Queue the scan job
    await this.queue.add(
      JobType.SCAN_LIBRARY,
      { scanId: scanJob.id, paths } as ScanLibraryJobData,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    );

    return scanJob.id;
  }

  // Queue a single file import job
  async queueFileImport(scanId: string, filePath: string): Promise<void> {
    await this.queue.add(
      JobType.IMPORT_FILE,
      { scanId, filePath } as ImportFileJobData,
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    );
  }

  // Helper method to update scan job status
  private async updateScanJobStatus(
    scanId: string,
    status: ScanJobStatus,
  ): Promise<void> {
    const completedAt =
      status === ScanJobStatus.COMPLETED || status === ScanJobStatus.FAILED
        ? new Date().toISOString()
        : undefined;

    await db
      .update(scanJobs)
      .set({
        status,
        ...(completedAt && { completedAt }),
      })
      .where(eq(scanJobs.id, scanId));
  }

  // Helper method to increment error count
  private async incrementScanJobErrorCount(scanId: string): Promise<void> {
    // Get current job first
    const [job] = await db
      .select()
      .from(scanJobs)
      .where(eq(scanJobs.id, scanId));

    if (job) {
      await db
        .update(scanJobs)
        .set({
          errorCount: (job.errorCount || 0) + 1,
        })
        .where(eq(scanJobs.id, scanId));
    }
  }

  // Close the queue and workers
  async close(): Promise<void> {
    await Promise.all(this.workers.map((worker) => worker.close()));
    await this.queue.close();
  }
}

// Export a singleton instance
export const queueService = new QueueService();
