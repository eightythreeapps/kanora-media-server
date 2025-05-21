import { db } from '../../db/config';
import { artists } from '../../db/schema/artists'; // Assuming this schema will be created/updated
import { Artist, PaginatedResponse } from '@kanora/shared-types';
import { SQL, asc, desc, count, like, eq } from 'drizzle-orm';

export class ArtistService {
  static async getAllArtists(
    page = 1,
    pageSize = 20,
    searchQuery = '',
    sortBy = 'name', // Default sort by name
    sortOrder = 'asc', // Default sort order ascending
  ): Promise<PaginatedResponse<Artist>> {
    const conditions: SQL[] = [];
    if (searchQuery) {
      conditions.push(like(artists.name, `%${searchQuery}%`));
    }

    const queryBuilder = db
      .select()
      .from(artists)
      .where(conditions.length ? eq(conditions[0], conditions[0]) : undefined); // Simplified where for single condition, adjust if more complex conditions needed

    // Determine sort column
    let orderByColumn;
    switch (sortBy) {
      // Add more cases if other sortable columns are needed, e.g., artist.id, etc.
      case 'name':
      default:
        orderByColumn = artists.name;
        break;
    }

    // Apply sorting order
    const orderedQuery =
      sortOrder === 'desc' ? desc(orderByColumn) : asc(orderByColumn);

    // Fetch paginated items
    const itemsQuery = queryBuilder
      .orderBy(orderedQuery)
      .limit(pageSize)
      .offset((page - 1) * pageSize);

    const items = await itemsQuery;

    // Get total count of items matching the criteria (without pagination)
    const totalQuery = db
      .select({ value: count() })
      .from(artists)
      .where(conditions.length ? eq(conditions[0], conditions[0]) : undefined);
    const totalResult = await totalQuery;
    const totalItems = totalResult[0]?.value || 0;

    return {
      items: items.map((item) => ({ ...item, albumCount: 0, trackCount: 0 })), // Placeholder for albumCount and trackCount
      totalItems,
      page,
      pageSize,
      totalPages: Math.ceil(totalItems / pageSize),
    };
  }

  static async getArtistDetails(artistId: string): Promise<Artist | null> {
    // TODO: Implement actual database query
    console.log(`ArtistService.getArtistDetails called for ID: ${artistId}`);

    const artistResult = await db
      .select()
      .from(artists)
      .where(eq(artists.id, artistId))
      .limit(1);
    if (!artistResult || artistResult.length === 0) {
      return null;
    }
    // TODO: Fetch albums and tracks for this artist to populate albumCount and trackCount
    return { ...artistResult[0], albumCount: 0, trackCount: 0 }; // Placeholder
  }
}
