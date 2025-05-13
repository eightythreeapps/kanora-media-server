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

// Job interface
interface Job {
  id: string;
  type: JobType;
  data: ScanLibraryJobData | ImportFileJobData;
  attempts: number;
  maxAttempts: number;
}

/**
 * Simple in-memory queue service that doesn't rely on Redis or external dependencies
 */
export class QueueService {
  private scannerService: LibraryScannerService;
  private queue: Job[] = [];
  private processing = false;
  private jobCounter = 0;

  constructor() {
    console.log(`Initializing in-memory queue service in ${env.NODE_ENV} mode`);
    this.scannerService = new LibraryScannerService();
    
    // Start processing the queue
    this.processQueue();
  }

  /**
   * Process the next job in the queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      // Schedule next check
      setTimeout(() => this.processQueue(), 1000);
      return;
    }

    this.processing = true;
    
    try {
      // Get the next job
      const job = this.queue.shift();
      
      if (job) {
        console.log(`Processing job ${job.id} of type ${job.type}`);
        
        try {
          await this.processJob(job);
          console.log(`Job ${job.id} completed`);
        } catch (error) {
          console.error(`Job ${job.id} failed:`, error);
          
          // Handle retry logic
          if (job.attempts < job.maxAttempts) {
            job.attempts++;
            // Add back to queue with exponential backoff
            const delayMs = Math.pow(2, job.attempts) * 1000;
            setTimeout(() => {
              this.queue.push(job);
            }, delayMs);
            
            console.log(`Job ${job.id} requeued for retry (attempt ${job.attempts}/${job.maxAttempts})`);
          } else {
            console.error(`Job ${job.id} failed permanently after ${job.maxAttempts} attempts`);
            
            // Update job status if it's a scan job
            if (job.type === JobType.SCAN_LIBRARY) {
              const scanData = job.data as ScanLibraryJobData;
              this.updateScanJobStatus(scanData.scanId, ScanJobStatus.FAILED);
            }
          }
        }
      }
    } finally {
      this.processing = false;
      
      // Continue processing the queue
      setTimeout(() => this.processQueue(), 100);
    }
  }

  /**
   * Process a job based on its type
   */
  private async processJob(job: Job): Promise<void> {
    switch (job.type) {
      case JobType.SCAN_LIBRARY:
        await this.processScanLibraryJob(job.data as ScanLibraryJobData);
        break;
      case JobType.IMPORT_FILE:
        await this.processImportFileJob(job.data as ImportFileJobData);
        break;
      default:
        throw new Error(`Unknown job type: ${job.type}`);
    }
  }

  /**
   * Process a library scan job
   */
  private async processScanLibraryJob(data: ScanLibraryJobData): Promise<void> {
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
      
      // Rethrow to trigger retry logic
      throw error;
    }
  }

  /**
   * Process a file import job
   */
  private async processImportFileJob(data: ImportFileJobData): Promise<void> {
    const { scanId, filePath } = data;

    try {
      // Process single file import
      await this.scannerService.importFile(scanId, filePath);
    } catch (error) {
      console.error(`Error importing file ${filePath}:`, error);
      
      // Increment error count in scan job
      await this.incrementScanJobErrorCount(scanId);
      
      // Rethrow to trigger retry logic
      throw error;
    }
  }

  /**
   * Add a job to scan the library
   */
  async queueLibraryScan(paths: string[] = [path.join(os.homedir(), 'Music')]): Promise<string> {
    // Create a new scan job in the database
    const [scanJob] = await db
      .insert(scanJobs)
      .values({
        status: ScanJobStatus.PENDING,
        progress: 0,
        startedAt: new Date().toISOString(),
      })
      .returning();

    // Add to the queue
    this.queue.push({
      id: `job_${++this.jobCounter}`,
      type: JobType.SCAN_LIBRARY,
      data: { scanId: scanJob.id, paths },
      attempts: 0,
      maxAttempts: 3
    });

    return scanJob.id;
  }

  /**
   * Add a job to import a file
   */
  async queueFileImport(scanId: string, filePath: string): Promise<void> {
    this.queue.push({
      id: `job_${++this.jobCounter}`,
      type: JobType.IMPORT_FILE,
      data: { scanId, filePath },
      attempts: 0,
      maxAttempts: 3
    });
  }

  /**
   * Update the status of a scan job
   */
  private async updateScanJobStatus(scanId: string, status: ScanJobStatus): Promise<void> {
    const completedAt = status === ScanJobStatus.COMPLETED || status === ScanJobStatus.FAILED
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

  /**
   * Increment the error count for a scan job
   */
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

  /**
   * Close the queue service
   */
  async close(): Promise<void> {
    // Nothing to close with in-memory implementation
  }
}

// Export a singleton instance
export const queueService = new QueueService(); 