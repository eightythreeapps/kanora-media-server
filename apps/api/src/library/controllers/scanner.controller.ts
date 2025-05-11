import { Request, Response } from 'express';
import { queueService } from '../services/queue.service';
import { db } from '../../db/config';
import { scanJobs } from '../../db/schema/system';
import { eq } from 'drizzle-orm';
import { fileWatcherService } from '../services/watcher.service';
import { env } from '../../env';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Initiate a manual scan of the music library
 */
export const startLibraryScan = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { paths } = req.body;

    // Default to the music library path if no paths provided
    const scanPaths =
      paths && Array.isArray(paths) && paths.length > 0
        ? paths
        : [env.MUSIC_LIBRARY_PATH];

    // Validate paths
    for (const p of scanPaths) {
      try {
        await fs.promises.access(p, fs.constants.R_OK);
      } catch (error) {
        res.status(400).json({
          success: false,
          message: `Path ${p} does not exist or is not readable`,
        });
        return;
      }
    }

    // Queue the scan job
    const scanId = await queueService.queueLibraryScan(scanPaths);

    res.status(202).json({
      success: true,
      message: 'Library scan initiated',
      data: {
        scanId,
      },
    });
  } catch (error) {
    console.error('Error starting library scan:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to initiate library scan',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get the status of a library scan
 */
export const getScanStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    // Find the scan job
    const scanJob = await db.query.scanJobs.findFirst({
      where: eq(scanJobs.id, id),
    });

    if (!scanJob) {
      res.status(404).json({
        success: false,
        message: `Scan with ID ${id} not found`,
      });
      return;
    }

    // Return the scan status
    res.status(200).json({
      success: true,
      data: {
        id: scanJob.id,
        status: scanJob.status,
        progress: scanJob.progress,
        currentFile: scanJob.currentFile,
        totalFiles: scanJob.totalFiles,
        processedFiles: scanJob.processedFiles,
        errorCount: scanJob.errorCount,
        startedAt: scanJob.startedAt,
        completedAt: scanJob.completedAt,
      },
    });
  } catch (error) {
    console.error('Error getting scan status:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to get scan status',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Start watching the music inbox directory
 */
export const startInboxWatcher = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    await fileWatcherService.startWatching();

    res.status(200).json({
      success: true,
      message: `Started watching ${env.MUSIC_INBOX_PATH} for new music files`,
    });
  } catch (error) {
    console.error('Error starting inbox watcher:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to start inbox watcher',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Stop watching the music inbox directory
 */
export const stopInboxWatcher = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    await fileWatcherService.stopWatching();

    res.status(200).json({
      success: true,
      message: 'Stopped watching for new music files',
    });
  } catch (error) {
    console.error('Error stopping inbox watcher:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to stop inbox watcher',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
