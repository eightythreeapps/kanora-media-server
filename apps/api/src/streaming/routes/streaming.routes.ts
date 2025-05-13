import { Router } from 'express';
import { authenticate } from '../../auth/middleware/authMiddleware';
import {
  streamAudio,
  streamTranscodedAudio,
  downloadAudio,
  getAlbumArt,
} from '../controllers/streaming.controller';

const router = Router();

// Stream audio routes
router.get('/tracks/:id/stream', authenticate, streamAudio);
router.get('/tracks/:id/transcode', authenticate, streamTranscodedAudio);
router.get('/tracks/:id/download', authenticate, downloadAudio);
router.get('/tracks/:id/art', authenticate, getAlbumArt);

export default router;
