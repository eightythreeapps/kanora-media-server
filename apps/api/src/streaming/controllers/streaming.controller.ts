import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { db } from '../../db/config';
import { tracks } from '../../db/schema/tracks';
import { eq } from 'drizzle-orm';
import { StreamingService } from '../services/streaming.service';

// Create an instance of the streaming service
const streamingService = new StreamingService();

/**
 * Stream an audio file by track ID
 */
export const streamAudio = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    // Find the track in the database
    const track = await db.query.tracks.findFirst({
      where: eq(tracks.id, id),
    });

    if (!track) {
      res.status(404).json({
        success: false,
        message: `Track with ID ${id} not found`,
      });
      return;
    }

    // Check if file exists
    if (!fs.existsSync(track.path)) {
      res.status(404).json({
        success: false,
        message: 'Audio file not found on the server',
      });
      return;
    }

    // Stream the file
    await streamingService.streamFile(req, res, track);
  } catch (error) {
    console.error('Error streaming audio:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to stream audio',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Stream audio with optional transcoding
 */
export const streamTranscodedAudio = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { bitrate = '320', format = 'mp3' } = req.query;

    // Find the track in the database
    const track = await db.query.tracks.findFirst({
      where: eq(tracks.id, id),
    });

    if (!track) {
      res.status(404).json({
        success: false,
        message: `Track with ID ${id} not found`,
      });
      return;
    }

    // Check if file exists
    if (!fs.existsSync(track.path)) {
      res.status(404).json({
        success: false,
        message: 'Audio file not found on the server',
      });
      return;
    }

    // Stream the file with transcoding
    const bitrateNum = parseInt(bitrate as string);
    await streamingService.streamTranscodedFile(
      req,
      res,
      track,
      format as string,
      bitrateNum,
    );
  } catch (error) {
    console.error('Error streaming transcoded audio:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to stream transcoded audio',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Download an audio file by track ID
 */
export const downloadAudio = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    // Find the track in the database
    const track = await db.query.tracks.findFirst({
      where: eq(tracks.id, id),
    });

    if (!track) {
      res.status(404).json({
        success: false,
        message: `Track with ID ${id} not found`,
      });
      return;
    }

    // Check if file exists
    if (!fs.existsSync(track.path)) {
      res.status(404).json({
        success: false,
        message: 'Audio file not found on the server',
      });
      return;
    }

    // Set headers for download
    const filename = path.basename(track.path);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Stream the file as download
    await streamingService.streamFile(req, res, track, true);
  } catch (error) {
    console.error('Error downloading audio:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to download audio',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get album art for a track
 */
export const getAlbumArt = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    // Find the track in the database
    const track = await db.query.tracks.findFirst({
      where: eq(tracks.id, id),
    });

    if (!track) {
      res.status(404).json({
        success: false,
        message: `Track with ID ${id} not found`,
      });
      return;
    }

    // Get album art
    await streamingService.getAlbumArt(req, res, track);
  } catch (error) {
    console.error('Error getting album art:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to get album art',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
