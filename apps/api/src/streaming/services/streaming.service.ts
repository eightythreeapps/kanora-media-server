import { Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import fluentFfmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';
import { exec } from 'child_process';
import { db } from '../../db/config';
import { tracks } from '../../db/schema/tracks';
import { albums } from '../../db/schema/albums';
import { eq } from 'drizzle-orm';

// MIME types for different audio formats
const MIME_TYPES: Record<string, string> = {
  mp3: 'audio/mpeg',
  flac: 'audio/flac',
  m4a: 'audio/mp4',
  ogg: 'audio/ogg',
  wav: 'audio/wav',
  aac: 'audio/aac',
};

export class StreamingService {
  /**
   * Stream a file with support for range requests (partial content)
   */
  async streamFile(
    req: Request,
    res: Response,
    track: any,
    isDownload = false,
  ): Promise<void> {
    const filePath = track.path;
    const fileSize = fs.statSync(filePath).size;

    // Get file extension
    const ext = path.extname(filePath).toLowerCase().substring(1);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    // Set content type header
    if (!isDownload) {
      res.setHeader('Content-Type', contentType);
    }

    // Parse range header
    const range = req.headers.range;

    if (range && !isDownload) {
      // Handle range request
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      const chunkSize = end - start + 1;

      // Set partial content headers
      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunkSize,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      });

      // Create read stream for the specified range
      const fileStream = fs.createReadStream(filePath, { start, end });
      fileStream.pipe(res);
    } else {
      // Handle full file request
      if (!isDownload) {
        // For regular streaming
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        });
      } else {
        // For downloads
        res.writeHead(200, {
          'Content-Length': fileSize,
          'Content-Type': 'application/octet-stream',
        });
      }

      // Stream the entire file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    }
  }

  /**
   * Stream a file with transcoding using ffmpeg
   */
  async streamTranscodedFile(
    req: Request,
    res: Response,
    track: any,
    format = 'mp3',
    bitrate = 320,
  ): Promise<void> {
    const filePath = track.path;

    // Validate format
    if (!Object.keys(MIME_TYPES).includes(format)) {
      res.status(400).json({
        success: false,
        message: `Unsupported format: ${format}`,
      });
      return;
    }

    // Validate bitrate
    if (bitrate < 64 || bitrate > 320) {
      res.status(400).json({
        success: false,
        message: 'Bitrate must be between 64 and 320 kbps',
      });
      return;
    }

    // Set content type header for the target format
    res.setHeader('Content-Type', MIME_TYPES[format]);
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    // Create ffmpeg command
    const command = fluentFfmpeg(filePath);

    // Configure based on format
    switch (format) {
      case 'mp3':
        command.format('mp3').audioCodec('libmp3lame').audioBitrate(bitrate);
        break;
      case 'ogg':
        command.format('ogg').audioCodec('libvorbis').audioBitrate(bitrate);
        break;
      case 'aac':
        command.format('adts').audioCodec('aac').audioBitrate(bitrate);
        break;
      default:
        // Default to mp3
        command.format('mp3').audioCodec('libmp3lame').audioBitrate(bitrate);
    }

    // Stream to response
    command
      .on('error', (err) => {
        console.error('FFmpeg error:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error transcoding audio',
            error: err.message,
          });
        }
      })
      .pipe(res, { end: true });

    // Handle client disconnect
    req.on('close', () => {
      command.kill('SIGKILL');
    });
  }

  /**
   * Get the track's album art if available
   */
  async getAlbumArt(req: Request, res: Response, track: any): Promise<void> {
    try {
      // Get album ID from track
      const albumId = track.albumId;

      // Get album from database
      const album = await db.query.albums.findFirst({
        where: eq(albums.id, albumId),
      });

      if (!album || !album.coverArtPath) {
        res.status(404).json({
          success: false,
          message: 'Album art not found',
        });
        return;
      }

      // Check if file exists
      if (!fs.existsSync(album.coverArtPath)) {
        res.status(404).json({
          success: false,
          message: 'Album art file not found on the server',
        });
        return;
      }

      // Get extension
      const ext = path.extname(album.coverArtPath).toLowerCase();
      let contentType = 'image/jpeg'; // Default

      // Set content type based on extension
      if (ext === '.png') {
        contentType = 'image/png';
      } else if (ext === '.gif') {
        contentType = 'image/gif';
      } else if (ext === '.webp') {
        contentType = 'image/webp';
      }

      // Set headers
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours

      // Stream the file
      const fileStream = fs.createReadStream(album.coverArtPath);
      fileStream.pipe(res);
    } catch (error) {
      console.error('Error getting album art:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to get album art',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
