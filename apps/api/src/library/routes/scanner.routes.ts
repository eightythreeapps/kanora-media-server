import { Router } from 'express';
import { authenticate } from '../../auth/middleware/authMiddleware';
import {
  startLibraryScan,
  getScanStatus,
  startInboxWatcher,
  stopInboxWatcher,
} from '../controllers/scanner.controller';

const router = Router();

// Scan library routes
router.post('/scan', authenticate, startLibraryScan);
router.get('/scan/status/:id', authenticate, getScanStatus);

// Inbox watcher routes
router.post('/inbox/watch/start', authenticate, startInboxWatcher);
router.post('/inbox/watch/stop', authenticate, stopInboxWatcher);

export default router; 