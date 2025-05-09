import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '@kanora/shared-types';
import { extractTokenFromHeader, verifyAccessToken, isTokenRevoked } from '../utils/jwt';
import { db } from '../../db/config';
import { users } from '../../db/schema/users';
import { eq } from 'drizzle-orm';

// Extend Express Request using module augmentation instead of namespace
declare module 'express' {
  interface Request {
    user?: {
      id: string;
      email: string;
      role: string;
    };
  }
}

/**
 * Middleware to verify JWT token
 */
export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    // Extract token from header
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }

    // Verify token
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }

    // Check if token is revoked (less important for access tokens but still good practice)
    const isRevoked = await isTokenRevoked(decoded.jti);
    if (isRevoked) {
      return res.status(401).json({
        success: false,
        error: 'Token has been revoked',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }

    // Fetch user from database to verify they still exist and are not disabled
    const user = await db.select()
      .from(users)
      .where(eq(users.id, decoded.sub))
      .get();

    if (!user || user.disabled) {
      return res.status(401).json({
        success: false,
        error: 'User not found or is disabled',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }

    // Attach user to request
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during authentication',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
}

/**
 * Middleware to require a specific role
 */
export function requireRole(role: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }

    next();
  };
}

/**
 * Middleware to require admin role
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  return requireRole('admin')(req, res, next);
} 