import { db } from '../../db/config';
import * as mm from 'music-metadata';
import { createReadStream, promises as fs } from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as fsExtra from 'fs-extra';
import { eq, and } from 'drizzle-orm';
import { scanJobs } from '../../db/schema/system';
import { artists } from '../../db/schema/artists';
import { albums } from '../../db/schema/albums';
import { tracks } from '../../db/schema/tracks';
import { env } from '../../env';
import { generateSortName } from '../utils/string.utils';

// Supported file extensions
const SUPPORTED_EXTENSIONS = ['.mp3', '.flac', '.m4a', '.ogg', '.wav'];

export class LibraryScannerService {
  /**
   * Scan library directories for music files
   */
  async scanLibrary(scanId: string, directories: string[]): Promise<void> {
    try {
      // Get all audio files from directories
      const files: string[] = [];
      for (const dir of directories) {
        await this.collectAudioFiles(dir, files);
      }

      // Update total files in the database
      await db
        .update(scanJobs)
        .set({
          totalFiles: files.length,
        })
        .where(eq(scanJobs.id, scanId));

      // Process files one by one
      let processedCount = 0;
      let errorCount = 0;

      for (const file of files) {
        try {
          // Update current file in the database
          await db
            .update(scanJobs)
            .set({
              currentFile: path.basename(file),
              progress: Math.floor((processedCount / files.length) * 100),
            })
            .where(eq(scanJobs.id, scanId));

          // Process the file
          await this.importFile(scanId, file);

          // Increment processed count
          processedCount++;

          // Update processed count in the database
          await db
            .update(scanJobs)
            .set({
              processedFiles: processedCount,
            })
            .where(eq(scanJobs.id, scanId));
        } catch (error) {
          console.error(`Error processing file ${file}:`, error);
          errorCount++;

          // Update error count in the database
          await db
            .update(scanJobs)
            .set({
              errorCount: errorCount,
            })
            .where(eq(scanJobs.id, scanId));
        }
      }

      // Update final progress
      await db
        .update(scanJobs)
        .set({
          progress: 100,
          processedFiles: processedCount,
          errorCount: errorCount,
          currentFile: null,
        })
        .where(eq(scanJobs.id, scanId));
    } catch (error) {
      console.error('Error scanning library:', error);
      throw error;
    }
  }

  /**
   * Import a single audio file
   */
  async importFile(scanId: string, filePath: string): Promise<void> {
    try {
      // Calculate content hash
      const contentHash = await this.calculateFileHash(filePath);

      // Check for duplicates
      const duplicates = await db
        .select()
        .from(tracks)
        .where(eq(tracks.contentHash, contentHash));

      if (duplicates.length > 0) {
        console.log(`Skipping duplicate file: ${filePath}`);
        return;
      }

      // Extract metadata
      const metadata = await mm.parseFile(filePath);

      // Get basic file info
      const fileStats = await fs.stat(filePath);

      // Get common tags
      const { common, format } = metadata;

      // Extract artist info
      const artistName =
        common.artist || common.albumartist || 'Unknown Artist';
      const sortArtistName = generateSortName(artistName);

      // Extract album info
      const albumTitle = common.album || 'Unknown Album';
      const sortAlbumTitle = generateSortName(albumTitle);

      // Extract track info
      const trackTitle =
        common.title || path.basename(filePath, path.extname(filePath));
      const sortTrackTitle = generateSortName(trackTitle);

      // Begin transaction
      await db.transaction(async (tx) => {
        // Find or create artist
        let artist = await tx
          .select()
          .from(artists)
          .where(eq(artists.name, artistName))
          .then((rows) => rows[0]);

        if (!artist) {
          artist = await tx
            .insert(artists)
            .values({
              name: artistName,
            })
            .returning()
            .then((rows) => rows[0]);
        }

        // Find or create album
        let album = await tx
          .select()
          .from(albums)
          .where(
            and(eq(albums.title, albumTitle), eq(albums.artistId, artist.id)),
          )
          .then((rows) => rows[0]);

        if (!album) {
          album = await tx
            .insert(albums)
            .values({
              title: albumTitle,
              sortTitle: sortAlbumTitle,
              artistId: artist.id,
              year: common.year ? parseInt(common.year.toString()) : null,
              // We'll handle cover art later
            })
            .returning()
            .then((rows) => rows[0]);
        }

        // Create track
        await tx.insert(tracks).values({
          title: trackTitle,
          sortTitle: sortTrackTitle,
          albumId: album.id,
          artistId: artist.id,
          trackNumber: common.track?.no || null,
          discNumber: common.disk?.no || null,
          duration: Math.floor(format.duration || 0),
          path: filePath,
          format: path.extname(filePath).substring(1),
          bitrate: format.bitrate ? Math.floor(format.bitrate) : null,
          fileSize: fileStats.size,
          contentHash,
        });

        // If auto-organize is enabled, move file to library in correct structure
        const systemSettings = await db.query.systemSettings.findFirst();

        if (systemSettings?.autoOrganize) {
          await this.organizeFile(filePath, artist.name, album.title);
        }
      });
    } catch (error) {
      console.error(`Error importing file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Recursively collect audio files from a directory
   */
  private async collectAudioFiles(
    directory: string,
    files: string[],
  ): Promise<void> {
    try {
      const entries = await fs.readdir(directory, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
          await this.collectAudioFiles(fullPath, files);
        } else if (entry.isFile() && this.isAudioFile(entry.name)) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error collecting files from ${directory}:`, error);
      throw error;
    }
  }

  /**
   * Check if a file is a supported audio file
   */
  private isAudioFile(filename: string): boolean {
    const extension = path.extname(filename).toLowerCase();
    return SUPPORTED_EXTENSIONS.includes(extension);
  }

  /**
   * Calculate SHA-256 hash of a file for duplicate detection
   */
  private async calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256');
      const stream = createReadStream(filePath);

      stream.on('error', (err) => reject(err));
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
    });
  }

  /**
   * Get system settings
   */
  private async getSystemSettings() {
    const settings = await db.query.systemSettings.findFirst();

    if (!settings) {
      throw new Error('System settings not found');
    }

    return settings;
  }

  /**
   * Organize a file into the music library structure
   */
  private async organizeFile(
    filePath: string,
    artistName: string,
    albumTitle: string,
  ): Promise<void> {
    try {
      // Get library path from settings
      const libraryPath = env.MUSIC_LIBRARY_PATH;

      // Create sanitized folder names
      const sanitizedArtist = this.sanitizeFolderName(artistName);
      const sanitizedAlbum = this.sanitizeFolderName(albumTitle);

      // Create destination path
      const destDir = path.join(libraryPath, sanitizedArtist, sanitizedAlbum);

      // Create directory if it doesn't exist
      await fsExtra.ensureDir(destDir);

      // Get original filename
      const fileName = path.basename(filePath);

      // Create destination path
      const destPath = path.join(destDir, fileName);

      // Move file
      await fsExtra.move(filePath, destPath, { overwrite: false });

      // Update path in database
      await db
        .update(tracks)
        .set({
          path: destPath,
        })
        .where(eq(tracks.path, filePath));
    } catch (error) {
      console.error(`Error organizing file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Sanitize folder name by removing invalid characters
   */
  private sanitizeFolderName(name: string): string {
    return name
      .replace(/[/\\?%*:|"<>]/g, '-') // Replace invalid characters with dash
      .replace(/^\.+/, '') // Remove leading dots
      .trim();
  }
}
