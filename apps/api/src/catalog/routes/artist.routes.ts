import { Router } from 'express';
import { authenticate } from '../../auth/middleware/authMiddleware'; // Assuming you want to protect these routes
import {
  getAllArtistsController,
  getArtistDetailsController,
} from '../controllers/artist.controller';

const router = Router();

router.get('/', authenticate, getAllArtistsController);
router.get('/:id', authenticate, getArtistDetailsController);

export default router;
