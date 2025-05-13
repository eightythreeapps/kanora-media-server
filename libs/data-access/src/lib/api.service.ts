import axios from 'axios';
import {
  ApiResponse,
  Media,
  PaginatedResponse,
  SearchQuery,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthResponse,
  User,
} from '@kanora/shared-types';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: process.env['NX_API_URL'] || 'http://localhost:3333',
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

  static async register(
    data: RegisterRequest,
  ): Promise<ApiResponse<AuthResponse>> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        '/auth/register',
        data,
      );
      return response.data;
    } catch (error) {
      return this.handleError<AuthResponse>(error);
    }
  }

  static async forgotPassword(
    data: ForgotPasswordRequest,
  ): Promise<ApiResponse<null>> {
    try {
      const response = await apiClient.post<ApiResponse<null>>(
        '/auth/forgot-password',
        data,
      );
      return response.data;
    } catch (error) {
      return this.handleError<null>(error);
    }
  }

  static async resetPassword(
    data: ResetPasswordRequest,
  ): Promise<ApiResponse<null>> {
    try {
      const response = await apiClient.post<ApiResponse<null>>(
        '/auth/reset-password',
        data,
      );
      return response.data;
    } catch (error) {
      return this.handleError<null>(error);
    }
  }

  static async getCurrentUser(): Promise<ApiResponse<User>> {
    try {
      const response = await apiClient.get<ApiResponse<User>>('/api/users/me');
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
