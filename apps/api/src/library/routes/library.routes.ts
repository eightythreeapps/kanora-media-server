import { Router } from 'express';
import { authenticate } from '../../auth/middleware/authMiddleware';
import {
  getAllArtists,
  getArtistById,
  getAllAlbums,
  getAlbumById,
  getAllTracks,
  getTrackById,
  uploadMusicFile,
  upload,
} from '../controllers/library.controller';

const router = Router();

// Artists routes
router.get('/artists', authenticate, getAllArtists);
router.get('/artists/:id', authenticate, getArtistById);

// Albums routes
router.get('/albums', authenticate, getAllAlbums);
router.get('/albums/:id', authenticate, getAlbumById);

// Tracks routes
router.get('/tracks', authenticate, getAllTracks);
router.get('/tracks/:id', authenticate, getTrackById);

// Upload route
router.post('/upload', authenticate, upload.single('file'), uploadMusicFile);

export default router;
