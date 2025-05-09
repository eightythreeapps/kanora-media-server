import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import * as schema from './index';

// Define type safety for all tables

// User types
export type User = InferSelectModel<typeof schema.users>;
export type NewUser = InferInsertModel<typeof schema.users>;
export type SafeUser = Omit<User, 'passwordHash'>;

// Artists types
export type Artist = InferSelectModel<typeof schema.artists>;
export type NewArtist = InferInsertModel<typeof schema.artists>;

// Albums types
export type Album = InferSelectModel<typeof schema.albums>;
export type NewAlbum = InferInsertModel<typeof schema.albums>;

// Tracks types
export type Track = InferSelectModel<typeof schema.tracks>;
export type NewTrack = InferInsertModel<typeof schema.tracks>;

// Playlists types
export type Playlist = InferSelectModel<typeof schema.playlists>;
export type NewPlaylist = InferInsertModel<typeof schema.playlists>;

// Playlist tracks types
export type PlaylistTrack = InferSelectModel<typeof schema.playlistTracks>;
export type NewPlaylistTrack = InferInsertModel<typeof schema.playlistTracks>;

// Revoked tokens types
export type RevokedToken = InferSelectModel<typeof schema.revokedTokens>;
export type NewRevokedToken = InferInsertModel<typeof schema.revokedTokens>;

// Scan jobs types
export type ScanJob = InferSelectModel<typeof schema.scanJobs>;
export type NewScanJob = InferInsertModel<typeof schema.scanJobs>;

// System settings types
export type SystemSettings = InferSelectModel<typeof schema.systemSettings>;
export type NewSystemSettings = InferInsertModel<typeof schema.systemSettings>; 