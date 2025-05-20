import { Request, Response } from 'express';
import { db } from '../../db/config';
import { artists } from '../../db/schema/artists';
import { albums } from '../../db/schema/albums';
import { tracks } from '../../db/schema/tracks';
import { eq, like, sql, desc, and } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';
import { createId } from '@paralleldrive/cuid2';
import { env } from '../../env';
import { queueService } from '../services/queue.service';
import multer from 'multer';

// Configure multer for memory storage
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
});

// Extend the Express Request type to include multer's file
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

/**
 * Get all artists
 */
export const getAllArtists = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { q, sort = 'name', order = 'asc' } = req.query;

    // Build where conditions
    const whereConditions = [];

    if (q && typeof q === 'string') {
      whereConditions.push(like(artists.name, `%${q}%`));
    }

    // Start query
    const query = db
      .select()
      .from(artists)
      .where(whereConditions.length ? and(...whereConditions) : undefined);

    // Apply sorting
    const finalQuery =
      sort === 'name' && order === 'desc'
        ? query.orderBy(desc(artists.name))
        : query.orderBy(artists.name);

    // Execute query
    const artistsList = await finalQuery;

    res.status(200).json({
      success: true,
      data: artistsList,
    });
  } catch (error) {
    console.error('Error getting artists:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to get artists',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get a single artist by ID
 */
export const getArtistById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    // Get artist
    const artist = await db.query.artists.findFirst({
      where: eq(artists.id, id),
    });

    if (!artist) {
      res.status(404).json({
        success: false,
        message: `Artist with ID ${id} not found`,
      });
      return;
    }

    // Get albums for this artist
    const artistAlbums = await db
      .select()
      .from(albums)
      .where(eq(albums.artistId, id))
      .orderBy(albums.sortTitle);

    res.status(200).json({
      success: true,
      data: {
        ...artist,
        albums: artistAlbums,
      },
    });
  } catch (error) {
    console.error('Error getting artist:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to get artist',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get all albums
 */
export const getAllAlbums = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { q, artist, sort = 'title', order = 'asc' } = req.query;

    // Build where conditions
    const whereConditions = [];

    if (artist && typeof artist === 'string') {
      whereConditions.push(eq(albums.artistId, artist));
    }

    if (q && typeof q === 'string') {
      whereConditions.push(like(albums.title, `%${q}%`));
    }

    // Start query with join
    const baseQuery = db
      .select({
        id: albums.id,
        title: albums.title,
        sortTitle: albums.sortTitle,
        artistId: albums.artistId,
        year: albums.year,
        coverArtPath: albums.coverArtPath,
        artistName: artists.name,
      })
      .from(albums)
      .leftJoin(artists, eq(albums.artistId, artists.id))
      .where(whereConditions.length ? and(...whereConditions) : undefined);

    // Apply sorting
    let queryAlbums;
    if (sort === 'title' && order === 'desc') {
      queryAlbums = baseQuery.orderBy(desc(albums.sortTitle));
    } else if (sort === 'title' && order === 'asc') {
      queryAlbums = baseQuery.orderBy(albums.sortTitle);
    } else if (sort === 'year' && order === 'desc') {
      queryAlbums = baseQuery.orderBy(desc(albums.year));
    } else if (sort === 'year' && order === 'asc') {
      queryAlbums = baseQuery.orderBy(albums.year);
    } else if (sort === 'artist' && order === 'desc') {
      queryAlbums = baseQuery.orderBy(desc(artists.name));
    } else if (sort === 'artist' && order === 'asc') {
      queryAlbums = baseQuery.orderBy(artists.name);
    } else {
      queryAlbums = baseQuery.orderBy(albums.sortTitle);
    }

    // Execute query
    const albumsList = await queryAlbums;

    res.status(200).json({
      success: true,
      data: albumsList,
    });
  } catch (error) {
    console.error('Error getting albums:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to get albums',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get a single album by ID
 */
export const getAlbumById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    // Get album with artist info
    const albumResults = await db
      .select({
        id: albums.id,
        title: albums.title,
        sortTitle: albums.sortTitle,
        artistId: albums.artistId,
        year: albums.year,
        coverArtPath: albums.coverArtPath,
        artistName: artists.name,
      })
      .from(albums)
      .leftJoin(artists, eq(albums.artistId, artists.id))
      .where(eq(albums.id, id));

    const album = albumResults[0];

    if (!album) {
      res.status(404).json({
        success: false,
        message: `Album with ID ${id} not found`,
      });
      return;
    }

    // Get tracks for this album
    const albumTracks = await db
      .select()
      .from(tracks)
      .where(eq(tracks.albumId, id))
      .orderBy(tracks.discNumber, tracks.trackNumber);

    res.status(200).json({
      success: true,
      data: {
        ...album,
        tracks: albumTracks,
      },
    });
  } catch (error) {
    console.error('Error getting album:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to get album',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get all tracks
 */
export const getAllTracks = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const {
      q,
      artist: artistId,
      album: albumId,
      sort = 'title',
      order = 'asc',
      page = 1,
      pageSize = 20,
    } = req.query;

    const numPage = Number(page);
    const numPageSize = Number(pageSize);

    // Build where conditions
    const whereConditions = [];

    if (artistId && typeof artistId === 'string') {
      whereConditions.push(eq(tracks.artistId, artistId));
    }
    if (albumId && typeof albumId === 'string') {
      whereConditions.push(eq(tracks.albumId, albumId as string));
    }

    if (q && typeof q === 'string') {
      whereConditions.push(like(tracks.title, `%${q}%`));
    }

    // Start query with joins
    const baseQueryTracks = db
      .select({
        id: tracks.id,
        title: tracks.title,
        artistName: artists.name,
        albumTitle: albums.title,
        trackNumber: tracks.trackNumber,
        discNumber: tracks.discNumber,
        duration: tracks.duration,
        filePath: tracks.path,
      })
      .from(tracks)
      .leftJoin(albums, eq(tracks.albumId, albums.id))
      .leftJoin(artists, eq(albums.artistId, artists.id))
      .where(whereConditions.length ? and(...whereConditions) : undefined);

    // Apply sorting for getAllTracks
    let queryTracks;
    if (sort === 'title' && order === 'desc') {
      queryTracks = baseQueryTracks.orderBy(desc(tracks.title));
    } else if (sort === 'title' && order === 'asc') {
      queryTracks = baseQueryTracks.orderBy(tracks.title);
    } else if (sort === 'artist' && order === 'desc') {
      queryTracks = baseQueryTracks.orderBy(desc(artists.name));
    } else if (sort === 'artist' && order === 'asc') {
      queryTracks = baseQueryTracks.orderBy(
        artists.name,
        albums.sortTitle,
        tracks.discNumber,
        tracks.trackNumber,
      );
    } else if (sort === 'album' && order === 'desc') {
      queryTracks = baseQueryTracks.orderBy(desc(albums.sortTitle));
    } else if (sort === 'album' && order === 'asc') {
      queryTracks = baseQueryTracks.orderBy(albums.sortTitle);
    } else if (sort === 'duration' && order === 'desc') {
      queryTracks = baseQueryTracks.orderBy(desc(tracks.duration));
    } else if (sort === 'duration' && order === 'asc') {
      queryTracks = baseQueryTracks.orderBy(tracks.duration);
    } else {
      queryTracks = baseQueryTracks.orderBy(
        albums.sortTitle,
        tracks.discNumber,
        tracks.trackNumber,
      );
    }

    // TODO: Implement pagination for tracks if baseQueryTracks supports limit/offset
    // const tracksList = await queryTracks.limit(pageSize).offset((page - 1) * pageSize);
    const tracksList = await queryTracks;

    // Get total count for pagination
    const countResult = await db.select({ count: sql`count(*)` }).from(tracks);
    const totalCount = Number(countResult[0].count);

    res.status(200).json({
      success: true,
      data: {
        items: tracksList,
        page: numPage,
        pageSize: numPageSize,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / numPageSize),
      },
    });
  } catch (error) {
    console.error('Error getting tracks:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to get tracks',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get a single track by ID
 */
export const getTrackById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    // Get track with artist and album info
    const trackResults = await db
      .select({
        id: tracks.id,
        title: tracks.title,
        sortTitle: tracks.sortTitle,
        artistId: tracks.artistId,
        albumId: tracks.albumId,
        trackNumber: tracks.trackNumber,
        discNumber: tracks.discNumber,
        duration: tracks.duration,
        path: tracks.path,
        format: tracks.format,
        fileSize: tracks.fileSize,
        bitrate: tracks.bitrate,
        contentHash: tracks.contentHash,
        artistName: artists.name,
        albumTitle: albums.title,
        year: albums.year,
        coverArtPath: albums.coverArtPath,
      })
      .from(tracks)
      .leftJoin(artists, eq(tracks.artistId, artists.id))
      .leftJoin(albums, eq(tracks.albumId, albums.id))
      .where(eq(tracks.id, id));

    const track = trackResults[0];

    if (!track) {
      res.status(404).json({
        success: false,
        message: `Track with ID ${id} not found`,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: track,
    });
  } catch (error) {
    console.error('Error getting track:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to get track',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Upload a music file
 */
export const uploadMusicFile = async (
  req: MulterRequest,
  res: Response,
): Promise<void> => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
      return;
    }

    const file = req.file;

    // Validate file type
    const supportedFormats = [
      'audio/mpeg',
      'audio/flac',
      'audio/wav',
      'audio/ogg',
      'audio/mp4',
    ];
    const supportedExtensions = ['.mp3', '.flac', '.wav', '.ogg', '.m4a'];

    const fileExtension = path.extname(file.originalname).toLowerCase();
    const isValidExtension = supportedExtensions.includes(fileExtension);
    const isValidMimeType = supportedFormats.includes(file.mimetype);

    if (!isValidExtension && !isValidMimeType) {
      res.status(400).json({
        success: false,
        message: 'Unsupported file format',
        data: {
          supportedFormats: supportedExtensions.join(', '),
        },
      });
      return;
    }

    // Generate a unique ID for the file
    const fileId = createId();

    // Store file in the music inbox directory
    const inboxPath = path.join(env.MUSIC_INBOX_PATH, fileId + fileExtension);

    // Ensure inbox directory exists
    await fs.promises.mkdir(env.MUSIC_INBOX_PATH, { recursive: true });

    // Move the file from temp upload to inbox
    await fs.promises.writeFile(inboxPath, file.buffer);

    // Queue the file for processing
    await queueService.queueFileImport(fileId, inboxPath);

    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        fileId,
        fileName: file.originalname,
      },
    });
  } catch (error) {
    console.error('Error uploading music file:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to upload music file',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};
