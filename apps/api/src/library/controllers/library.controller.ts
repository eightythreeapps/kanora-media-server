import { Request, Response } from 'express';
import { db } from '../../db/config';
import { artists } from '../../db/schema/artists';
import { albums } from '../../db/schema/albums';
import { tracks } from '../../db/schema/tracks';
import { eq, like, sql } from 'drizzle-orm';

/**
 * Get all artists
 */
export const getAllArtists = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { q, sort = 'name', order = 'asc' } = req.query;

    // Start query
    let query = db.select().from(artists);

    // Apply search filter if provided
    if (q && typeof q === 'string') {
      query = query.where(like(artists.name, `%${q}%`));
    }

    // Apply sorting
    if (sort === 'name' && order === 'asc') {
      query = query.orderBy(artists.sortName);
    } else if (sort === 'name' && order === 'desc') {
      query = query.orderBy(artists.sortName, 'desc');
    }

    // Execute query
    const artistsList = await query;

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

    // Start query
    let query = db
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
      .leftJoin(artists, eq(albums.artistId, artists.id));

    // Apply artist filter if provided
    if (artist && typeof artist === 'string') {
      query = query.where(eq(albums.artistId, artist));
    }

    // Apply search filter if provided
    if (q && typeof q === 'string') {
      query = query.where(like(albums.title, `%${q}%`));
    }

    // Apply sorting
    if (sort === 'title' && order === 'asc') {
      query = query.orderBy(albums.sortTitle);
    } else if (sort === 'title' && order === 'desc') {
      query = query.orderBy(albums.sortTitle, 'desc');
    } else if (sort === 'year' && order === 'asc') {
      query = query.orderBy(albums.year);
    } else if (sort === 'year' && order === 'desc') {
      query = query.orderBy(albums.year, 'desc');
    } else if (sort === 'artist' && order === 'asc') {
      query = query.orderBy(artists.sortName);
    } else if (sort === 'artist' && order === 'desc') {
      query = query.orderBy(artists.sortName, 'desc');
    }

    // Execute query
    const albumsList = await query;

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
    const album = await db
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
      .where(eq(albums.id, id))
      .then((rows) => rows[0]);

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
      artist,
      album,
      sort = 'title',
      order = 'asc',
      limit = '100',
      offset = '0',
    } = req.query;

    // Parse limit and offset
    const parsedLimit = Math.min(parseInt(limit as string) || 100, 1000);
    const parsedOffset = parseInt(offset as string) || 0;

    // Start query
    let query = db
      .select({
        id: tracks.id,
        title: tracks.title,
        sortTitle: tracks.sortTitle,
        artistId: tracks.artistId,
        albumId: tracks.albumId,
        trackNumber: tracks.trackNumber,
        discNumber: tracks.discNumber,
        duration: tracks.duration,
        format: tracks.format,
        bitrate: tracks.bitrate,
        artistName: artists.name,
        albumTitle: albums.title,
        year: albums.year,
      })
      .from(tracks)
      .leftJoin(artists, eq(tracks.artistId, artists.id))
      .leftJoin(albums, eq(tracks.albumId, albums.id));

    // Apply artist filter if provided
    if (artist && typeof artist === 'string') {
      query = query.where(eq(tracks.artistId, artist));
    }

    // Apply album filter if provided
    if (album && typeof album === 'string') {
      query = query.where(eq(tracks.albumId, album));
    }

    // Apply search filter if provided
    if (q && typeof q === 'string') {
      query = query.where(like(tracks.title, `%${q}%`));
    }

    // Apply sorting
    if (sort === 'title' && order === 'asc') {
      query = query.orderBy(tracks.sortTitle);
    } else if (sort === 'title' && order === 'desc') {
      query = query.orderBy(tracks.sortTitle, 'desc');
    } else if (sort === 'album' && order === 'asc') {
      query = query.orderBy(
        albums.sortTitle,
        tracks.discNumber,
        tracks.trackNumber,
      );
    } else if (sort === 'album' && order === 'desc') {
      query = query.orderBy(
        albums.sortTitle,
        'desc',
        tracks.discNumber,
        'desc',
        tracks.trackNumber,
        'desc',
      );
    } else if (sort === 'artist' && order === 'asc') {
      query = query.orderBy(
        artists.sortName,
        albums.sortTitle,
        tracks.discNumber,
        tracks.trackNumber,
      );
    } else if (sort === 'artist' && order === 'desc') {
      query = query.orderBy(
        artists.sortName,
        'desc',
        albums.sortTitle,
        'desc',
        tracks.discNumber,
        'desc',
        tracks.trackNumber,
        'desc',
      );
    } else if (sort === 'duration' && order === 'asc') {
      query = query.orderBy(tracks.duration);
    } else if (sort === 'duration' && order === 'desc') {
      query = query.orderBy(tracks.duration, 'desc');
    }

    // Apply pagination
    query = query.limit(parsedLimit).offset(parsedOffset);

    // Execute query
    const tracksList = await query;

    // Get total count for pagination
    const totalCount = await db
      .select({ count: sql`count(*)` })
      .from(tracks)
      .then((rows) => Number(rows[0].count));

    res.status(200).json({
      success: true,
      data: {
        tracks: tracksList,
        pagination: {
          total: totalCount,
          limit: parsedLimit,
          offset: parsedOffset,
        },
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
    const track = await db
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
        bitrate: tracks.bitrate,
        fileSize: tracks.fileSize,
        artistName: artists.name,
        albumTitle: albums.title,
        year: albums.year,
        coverArtPath: albums.coverArtPath,
      })
      .from(tracks)
      .leftJoin(artists, eq(tracks.artistId, artists.id))
      .leftJoin(albums, eq(tracks.albumId, albums.id))
      .where(eq(tracks.id, id))
      .then((rows) => rows[0]);

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
