import { Request, Response } from 'express';
import { db } from '../../db/config';
import { users, UserRole } from '../../db/schema/users';
import { revokedTokens } from '../../db/schema/auth';
import { eq } from 'drizzle-orm';
import { ApiResponse } from '@kanora/shared-types';
import { hashPassword, validatePasswordStrength, verifyPassword } from '../utils/password';
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
 * Register a new user
 */
export async function register(req: Request, res: Response) {
  try {
    const { email, password, displayName } = req.body;

    // Validate required fields
    if (!email || !password || !displayName) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and display name are required',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: passwordValidation.reason,
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }

    // Check if user already exists
    const existingUser = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .get();

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Create the user
    const newUser = await db.insert(users)
      .values({
        email,
        passwordHash,
        displayName,
        role: UserRole.USER
      })
      .returning()
      .get();

    // Generate tokens
    const tokens = generateTokenPair(newUser.id, newUser.email, newUser.role);

    // Return user profile and tokens
    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          displayName: newUser.displayName,
          role: newUser.role
        },
        ...tokens
      },
      timestamp: new Date().toISOString()
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during registration',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
}

/**
 * Login a user
 */
export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }

    // Find the user
    const user = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .get();

    // Check if user exists and is not disabled
    if (!user || user.disabled) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }

    // Update last login time
    await db.update(users)
      .set({ lastLogin: new Date().toISOString() })
      .where(eq(users.id, user.id))
      .run();

    // Generate tokens
    const tokens = generateTokenPair(user.id, user.email, user.role);

    // Return user profile and tokens
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
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
    const newTokens = generateTokenPair(user.id, user.email, user.role);

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