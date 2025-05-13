import { Request, Response } from 'express';
import { db } from '../../db/config';
import { users, UserRole } from '../../db/schema/users';
import { revokedTokens } from '../../db/schema/auth';
import { eq } from 'drizzle-orm';
import { ApiResponse } from '@kanora/shared-types';
import { hashPin, validatePin, verifyPin } from '../utils/pin';
import {
  TokenPair,
  extractTokenFromHeader,
  generateTokenPair,
  isTokenRevoked,
  revokeToken,
  verifyRefreshToken
} from '../utils/jwt';
import jwt from 'jsonwebtoken';

/**
 * Login a user with username and PIN
 */
export async function login(req: Request, res: Response) {
  try {
    const { username, pin } = req.body;

    // Validate required fields
    if (!username) {
      return res.status(400).json({
        success: false,
        error: 'Username is required',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }

    // Find the user
    const user = await db.select()
      .from(users)
      .where(eq(users.username, username))
      .get();

    // Check if user exists and is not disabled
    if (!user || user.disabled) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }

    // For PIN-based authentication
    if (user.pinHash) {
      // PIN is required for users with PIN authentication
      if (!pin) {
        return res.status(400).json({
          success: false,
          error: 'PIN is required',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
      }

      // Verify PIN
      const isPinValid = await verifyPin(pin, user.pinHash);
      if (!isPinValid) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
      }
    } else {
      // If the user doesn't have a PIN set, they can log in without one
      // This allows for non-protected user accounts that don't require authentication
      // You might want to restrict access further based on your security requirements
    }

    // Update last login time
    await db.update(users)
      .set({ lastLogin: new Date().toISOString() })
      .where(eq(users.id, user.id))
      .run();

    // Generate tokens
    const tokens = generateTokenPair(user.id, user.username, user.role);

    // Return user profile and tokens
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          role: user.role
        },
        ...tokens
      },
      timestamp: new Date().toISOString()
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during login',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshToken(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;

    // Validate required fields
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }

    // Check if token is revoked
    const isRevoked = await isTokenRevoked(decoded.jti);
    if (isRevoked) {
      return res.status(401).json({
        success: false,
        error: 'Refresh token has been revoked',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }

    // Find the user
    const user = await db.select()
      .from(users)
      .where(eq(users.id, decoded.sub))
      .get();

    // Check if user exists and is not disabled
    if (!user || user.disabled) {
      return res.status(401).json({
        success: false,
        error: 'User not found or is disabled',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }

    // Revoke the old refresh token (JTI rotation)
    const decodedJwt = jwt.decode(refreshToken) as jwt.JwtPayload;
    const expiryDate = new Date(decodedJwt.exp! * 1000);
    
    await revokeToken(decoded.jti, user.id, expiryDate);

    // Generate new token pair
    const newTokens = generateTokenPair(user.id, user.username, user.role);

    // Return the new tokens
    return res.status(200).json({
      success: true,
      data: newTokens,
      timestamp: new Date().toISOString()
    } as ApiResponse<TokenPair>);
  } catch (error) {
    console.error('Token refresh error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during token refresh',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
}

/**
 * Logout a user by revoking their refresh token
 */
export async function logout(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;

    // Validate required fields
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }

    // Verify refresh token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(200).json({
        success: true,
        data: { message: 'Logged out successfully' },
        timestamp: new Date().toISOString()
      } as ApiResponse<{ message: string }>);
    }

    // Revoke the refresh token
    const decodedJwt = jwt.decode(refreshToken) as jwt.JwtPayload;
    const expiryDate = new Date(decodedJwt.exp! * 1000);
    
    await revokeToken(decoded.jti, decoded.sub, expiryDate);

    // Return success message
    return res.status(200).json({
      success: true,
      data: { message: 'Logged out successfully' },
      timestamp: new Date().toISOString()
    } as ApiResponse<{ message: string }>);
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during logout',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
} 