import { Request, Response } from 'express';
import { db } from '../../db/config';
import { artists } from '../../db/schema/artists';
import { albums } from '../../db/schema/albums';
import { tracks } from '../../db/schema/tracks';
import { eq, like, sql, desc, and } from 'drizzle-orm';

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
        ? query.orderBy(desc(artists.sortName))
        : query.orderBy(artists.sortName);

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
    let query;
    if (sort === 'title' && order === 'desc') {
      query = baseQuery.orderBy(desc(albums.sortTitle));
    } else if (sort === 'title' && order === 'asc') {
      query = baseQuery.orderBy(albums.sortTitle);
    } else if (sort === 'year' && order === 'desc') {
      query = baseQuery.orderBy(desc(albums.year));
    } else if (sort === 'year' && order === 'asc') {
      query = baseQuery.orderBy(albums.year);
    } else if (sort === 'artist' && order === 'desc') {
      query = baseQuery.orderBy(desc(artists.sortName));
    } else if (sort === 'artist' && order === 'asc') {
      query = baseQuery.orderBy(artists.sortName);
    } else {
      query = baseQuery.orderBy(albums.sortTitle);
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

    // Build where conditions
    const whereConditions = [];

    if (artist && typeof artist === 'string') {
      whereConditions.push(eq(tracks.artistId, artist));
    }

    if (album && typeof album === 'string') {
      whereConditions.push(eq(tracks.albumId, album));
    }

    if (q && typeof q === 'string') {
      whereConditions.push(like(tracks.title, `%${q}%`));
    }

    // Start query
    const baseQuery = db
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
      .leftJoin(albums, eq(tracks.albumId, albums.id))
      .where(whereConditions.length ? and(...whereConditions) : undefined);

    // Apply sorting
    let query;
    if (sort === 'title' && order === 'desc') {
      query = baseQuery.orderBy(desc(tracks.sortTitle));
    } else if (sort === 'title' && order === 'asc') {
      query = baseQuery.orderBy(tracks.sortTitle);
    } else if (sort === 'album' && order === 'desc') {
      query = baseQuery.orderBy(desc(albums.sortTitle));
    } else if (sort === 'album' && order === 'asc') {
      query = baseQuery.orderBy(
        albums.sortTitle,
        tracks.discNumber,
        tracks.trackNumber,
      );
    } else if (sort === 'artist' && order === 'desc') {
      query = baseQuery.orderBy(desc(artists.sortName));
    } else if (sort === 'artist' && order === 'asc') {
      query = baseQuery.orderBy(
        artists.sortName,
        albums.sortTitle,
        tracks.discNumber,
        tracks.trackNumber,
      );
    } else if (sort === 'duration' && order === 'desc') {
      query = baseQuery.orderBy(desc(tracks.duration));
    } else if (sort === 'duration' && order === 'asc') {
      query = baseQuery.orderBy(tracks.duration);
    } else {
      query = baseQuery.orderBy(
        albums.sortTitle,
        tracks.discNumber,
        tracks.trackNumber,
      );
    }

    // Apply pagination
    const paginatedQuery = query.limit(parsedLimit).offset(parsedOffset);

    // Execute query
    const tracksList = await paginatedQuery;

    // Get total count for pagination
    const countResult = await db.select({ count: sql`count(*)` }).from(tracks);
    const totalCount = Number(countResult[0].count);

    res.status(200).json({
      success: true,
      data: {
        items: tracksList,
        page: Math.floor(parsedOffset / parsedLimit) + 1,
        pageSize: parsedLimit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / parsedLimit),
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
