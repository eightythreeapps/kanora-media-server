import axios from 'axios';
import { 
  ApiResponse, 
  Media, 
  PaginatedResponse, 
  SearchQuery 
} from '@kanora/shared-types';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: process.env['NX_API_URL'] || 'http://localhost:3333/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export class ApiService {
  // Media endpoints
  static async getAllMedia(): Promise<ApiResponse<Media[]>> {
    try {
      const response = await apiClient.get<ApiResponse<Media[]>>('/media');
      return response.data;
    } catch (error) {
      return this.handleError<Media[]>(error);
    }
  }

  static async getMediaById(id: string): Promise<ApiResponse<Media>> {
    try {
      const response = await apiClient.get<ApiResponse<Media>>(`/media/${id}`);
      return response.data;
    } catch (error) {
      return this.handleError<Media>(error);
    }
  }

  static async searchMedia(query: SearchQuery): Promise<ApiResponse<PaginatedResponse<Media>>> {
    try {
      const response = await apiClient.post<ApiResponse<PaginatedResponse<Media>>>('/media/search', query);
      return response.data;
    } catch (error) {
      return this.handleError<PaginatedResponse<Media>>(error);
    }
  }

  // Error handling
  private static handleError<T>(error: unknown): ApiResponse<T> {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      success: false,
      error: 'An unknown error occurred',
      timestamp: new Date().toISOString(),
    };
  }
} 