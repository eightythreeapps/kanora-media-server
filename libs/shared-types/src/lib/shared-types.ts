export function sharedTypes(): string {
  return 'shared-types';
}

export enum MediaType {
  MOVIE = 'movie',
  TV_SHOW = 'tv_show',
  MUSIC = 'music',
  PHOTO = 'photo',
  OTHER = 'other',
}

export interface Media {
  id: string;
  title: string;
  description?: string;
  type: MediaType;
  path: string;
  fileSize: number;
  dateAdded: string;
  dateModified: string;
  duration?: number;
  thumbnailPath?: string;
  metadata?: Record<string, unknown>;
}

export interface Movie extends Media {
  type: MediaType.MOVIE;
  year?: number;
  director?: string;
  cast?: string[];
  genre?: string[];
  runtime?: number;
}

export interface TvShow extends Media {
  type: MediaType.TV_SHOW;
  season?: number;
  episode?: number;
  series?: string;
}

export interface MusicTrack extends Media {
  type: MediaType.MUSIC;
  artist?: string;
  album?: string;
  genre?: string[];
  trackNumber?: number;
}

export interface Photo extends Media {
  type: MediaType.PHOTO;
  width?: number;
  height?: number;
  location?: string;
  takenAt?: string;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  displayName: string;
  role: string;
  hasPin?: boolean;
  createdAt: string;
  updatedAt: string;
  disabled?: boolean;
  lastLogin?: string;
}

export interface UserListResponse {
  users: User[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}

export interface CreateUserRequest {
  username: string;
  email?: string;
  displayName: string;
  pin?: string;
  role?: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
  displayName?: string;
  role?: string;
  disabled?: boolean;
  pin?: string;
  removePin?: boolean;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  subtitlesEnabled?: boolean;
  defaultAudioLanguage?: string;
  defaultSubtitleLanguage?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  userId: string;
  mediaIds: string[];
  dateCreated: string;
  dateModified: string;
  isPublic: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface SearchQuery {
  term?: string;
  types?: MediaType[];
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

// Authentication types
export interface LoginRequest {
  username: string;
  pin?: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  email?: string;
  currentPin?: string;
  newPin?: string;
  removePin?: boolean;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}
