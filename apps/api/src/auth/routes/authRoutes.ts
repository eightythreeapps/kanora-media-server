import express from 'express';
import { login, refreshToken, logout } from '../controllers/authController';

const router = express.Router();

// POST /auth/login - Login a user
router.post('/login', login);

// POST /auth/refresh - Refresh access token
router.post('/refresh', refreshToken);

// POST /auth/logout - Logout a user
router.post('/logout', logout);

export default router; 