import axios from 'axios';
import {
  ApiResponse,
  Media,
  PaginatedResponse,
  SearchQuery,
  LoginRequest,
  AuthResponse,
  User,
  UserListResponse,
  CreateUserRequest,
  UpdateUserRequest,
  UpdateProfileRequest,
  ScanStatus,
  Artist,
  ArtistDetails,
  AlbumDetails,
} from '@kanora/shared-types';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3333',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export class ApiService {
  // Authentication endpoints
  static async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        '/auth/login',
        data,
      );
      if (response.data.success && response.data.data) {
        localStorage.setItem('auth_token', response.data.data.accessToken);
        localStorage.setItem('refresh_token', response.data.data.refreshToken);
      }
      return response.data;
    } catch (error) {
      return this.handleError<AuthResponse>(error);
    }
  }

  static async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.get<ApiResponse<User>>('/api/me');
      return response.data;
    } catch (error) {
      return this.handleError<User>(error);
    }
  }

  static async updateProfile(
    data: UpdateProfileRequest,
  ): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.put<ApiResponse<User>>('/api/me', data);
      return response.data;
    } catch (error) {
      return this.handleError<User>(error);
    }
  }

  static async logout(): Promise<ApiResponse<null>> {
    try {
      const response = await apiClient.post<ApiResponse<null>>('/auth/logout');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      return response.data;
    } catch (error) {
      // Still remove tokens on error
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      return this.handleError<null>(error);
    }
  }

  // Admin user management endpoints
  static async listUsers(
    page = 1,
    pageSize = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  ): Promise<ApiResponse<UserListResponse>> {
    try {
      const response = await apiClient.get<ApiResponse<UserListResponse>>(
        `/api/users?page=${page}&pageSize=${pageSize}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
      );
      return response.data;
    } catch (error) {
      return this.handleError<UserListResponse>(error);
    }
  }

  static async createUser(data: CreateUserRequest): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.post<ApiResponse<User>>(
        '/api/users',
        data,
      );
      return response.data;
    } catch (error) {
      return this.handleError<User>(error);
    }
  }

  static async getUserById(id: string): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.get<ApiResponse<User>>(
        `/api/users/${id}`,
      );
      return response.data;
    } catch (error) {
      return this.handleError<User>(error);
    }
  }

  static async updateUser(
    id: string,
    data: UpdateUserRequest,
  ): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.put<ApiResponse<User>>(
        `/api/users/${id}`,
        data,
      );
      return response.data;
    } catch (error) {
      return this.handleError<User>(error);
    }
  }

  static async disableUser(id: string): Promise<ApiResponse<null>> {
    try {
      const response = await apiClient.delete<ApiResponse<null>>(
        `/api/users/${id}`,
      );
      return response.data;
    } catch (error) {
      return this.handleError<null>(error);
    }
  }

  // Media endpoints
  static async getAllMedia(): Promise<ApiResponse<Media[]>> {
    try {
      const response = await apiClient.get<ApiResponse<Media[]>>('/api/media');
      return response.data;
    } catch (error) {
      return this.handleError<Media[]>(error);
    }
  }

  static async getMediaById(id: string): Promise<ApiResponse<Media>> {
    try {
      const response = await apiClient.get<ApiResponse<Media>>(
        `/api/media/${id}`,
      );
      return response.data;
    } catch (error) {
      return this.handleError<Media>(error);
    }
  }

  static async searchMedia(
    query: SearchQuery,
  ): Promise<ApiResponse<PaginatedResponse<Media>>> {
    try {
      const response = await apiClient.post<
        ApiResponse<PaginatedResponse<Media>>
      >('/api/media/search', query);
      return response.data;
    } catch (error) {
      return this.handleError<PaginatedResponse<Media>>(error);
    }
  }

  // Library scanner endpoints
  static async startLibraryScan(
    paths?: string[],
  ): Promise<ApiResponse<{ scanId: string }>> {
    try {
      const response = await apiClient.post<ApiResponse<{ scanId: string }>>(
        '/api/library/scan',
        { paths },
      );
      return response.data;
    } catch (error) {
      return this.handleError<{ scanId: string }>(error);
    }
  }

  static async getScanStatus(scanId: string): Promise<ApiResponse<ScanStatus>> {
    try {
      const response = await apiClient.get<ApiResponse<ScanStatus>>(
        `/api/library/scan/status/${scanId}`,
      );
      return response.data;
    } catch (error) {
      return this.handleError<ScanStatus>(error);
    }
  }

  static async uploadMusic(
    formData: FormData,
    onProgress?: (progress: number) => void,
  ): Promise<ApiResponse<{ fileId: string }>> {
    try {
      // Create a custom axios instance for this request to handle file uploads with progress
      const response = await axios.post<ApiResponse<{ fileId: string }>>(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3333'}/api/library/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(localStorage.getItem('auth_token')
              ? {
                  Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                }
              : {}),
          },
          onUploadProgress: (progressEvent) => {
            if (onProgress && progressEvent.total) {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total,
              );
              onProgress(percentCompleted);
            }
          },
        },
      );

      return response.data;
    } catch (error) {
      return this.handleError<{ fileId: string }>(error);
    }
  }

  static async startInboxWatcher(): Promise<ApiResponse<null>> {
    try {
      const response = await apiClient.post<ApiResponse<null>>(
        '/api/library/inbox/watch/start',
      );
      return response.data;
    } catch (error) {
      return this.handleError<null>(error);
    }
  }

  static async stopInboxWatcher(): Promise<ApiResponse<null>> {
    try {
      const response = await apiClient.post<ApiResponse<null>>(
        '/api/library/inbox/watch/stop',
      );
      return response.data;
    } catch (error) {
      return this.handleError<null>(error);
    }
  }

  // Catalog browsing endpoints
  static async getAllArtists(
    page = 1,
    pageSize = 20,
    searchQuery = '',
    sortBy = 'name',
    sortOrder = 'asc',
  ): Promise<ApiResponse<PaginatedResponse<Artist>>> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
        sortBy,
        sortOrder,
      });
      if (searchQuery) {
        params.append('q', searchQuery);
      }
      const response = await apiClient.get<
        ApiResponse<PaginatedResponse<Artist>>
      >(`/api/artists?${params.toString()}`);
      return response.data;
    } catch (error) {
      return this.handleError<PaginatedResponse<Artist>>(error);
    }
  }

  static async getArtistDetails(
    artistId: string,
  ): Promise<ApiResponse<ArtistDetails>> {
    try {
      const response = await apiClient.get<ApiResponse<ArtistDetails>>(
        `/api/artists/${artistId}`,
      );
      return response.data;
    } catch (error) {
      return this.handleError<ArtistDetails>(error);
    }
  }

  static async getAlbumDetails(
    albumId: string,
  ): Promise<ApiResponse<AlbumDetails>> {
    try {
      const response = await apiClient.get<ApiResponse<AlbumDetails>>(
        `/api/albums/${albumId}`,
      );
      return response.data;
    } catch (error) {
      return this.handleError<AlbumDetails>(error);
    }
  }
  // End Catalog browsing endpoints

  // Error handling
  private static handleError<T>(error: unknown): ApiResponse<T> {
    if (axios.isAxiosError(error)) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
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
