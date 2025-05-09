import express from 'express';
import {
  listUsers,
  createUser,
  getUserById,
  updateUser,
  disableUser,
  getProfile,
  updateProfile
} from '../controllers/userController';
import { authenticate, requireAdmin } from '../../auth/middleware/authMiddleware';

const router = express.Router();

// Admin routes
router.get('/users', authenticate, requireAdmin, listUsers);
router.post('/users', authenticate, requireAdmin, createUser);
router.get('/users/:id', authenticate, requireAdmin, getUserById);
router.put('/users/:id', authenticate, requireAdmin, updateUser);
router.delete('/users/:id', authenticate, requireAdmin, disableUser);

// Self profile routes
router.get('/me', authenticate, getProfile);
router.put('/me', authenticate, updateProfile);

export default router; 