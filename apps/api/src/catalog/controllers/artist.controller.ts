import { Request, Response } from 'express';
import { ArtistService } from '../services/artist.service';
import { ApiResponse } from '@kanora/shared-types';

export const getAllArtistsController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const searchQuery = (req.query.q as string) || '';
    const sortBy = (req.query.sortBy as string) || 'name';
    const sortOrder = (req.query.sortOrder as 'asc' | 'desc') || 'asc';

    const result = await ArtistService.getAllArtists(
      page,
      pageSize,
      searchQuery,
      sortBy,
      sortOrder,
    );

    const response: ApiResponse<typeof result> = {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
    res.json(response);
  } catch (error) {
    console.error('Error in getAllArtistsController:', error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch artists',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
};

export const getArtistDetailsController = async (
  req: Request,
  res: Response,
) => {
  try {
    const { id } = req.params;
    const artist = await ArtistService.getArtistDetails(id);
    if (!artist) {
      const response: ApiResponse<null> = {
        success: false,
        error: 'Artist not found',
        timestamp: new Date().toISOString(),
      };
      return res.status(404).json(response);
    }
    const response: ApiResponse<typeof artist> = {
      success: true,
      data: artist,
      timestamp: new Date().toISOString(),
    };
    res.json(response);
  } catch (error) {
    console.error(`Error fetching details for artist ${req.params.id}:`, error);
    const response: ApiResponse<null> = {
      success: false,
      error: 'Failed to fetch artist details',
      timestamp: new Date().toISOString(),
    };
    res.status(500).json(response);
  }
};
