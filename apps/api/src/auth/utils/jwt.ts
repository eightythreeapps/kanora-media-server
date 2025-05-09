import jwt, { SignOptions } from 'jsonwebtoken';
import { createId } from '@paralleldrive/cuid2';
import { env } from '../../env';
import { db } from '../../db/config';
import { revokedTokens } from '../../db/schema/auth';
import { eq, lt } from 'drizzle-orm';

// Token types
export interface TokenPayload {
  sub: string;        // Subject (user ID)
  email: string;      // User email
  role: string;       // User role
  jti: string;        // JWT ID (unique identifier for this token)
  type: 'access' | 'refresh'; // Token type
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;  // Seconds until access token expires
}

/**
 * Generate a JWT access token for a user
 */
export function generateAccessToken(userId: string, email: string, role: string): string {
  const payload: TokenPayload = {
    sub: userId,
    email,
    role,
    jti: createId(),
    type: 'access'
  };

  const options: SignOptions = {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN
  };

  return jwt.sign(payload, env.JWT_SECRET, options);
}

/**
 * Generate a JWT refresh token for a user
 */
export function generateRefreshToken(userId: string, email: string, role: string): string {
  const payload: TokenPayload = {
    sub: userId,
    email,
    role,
    jti: createId(),
    type: 'refresh'
  };

  const options: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN
  };

  return jwt.sign(payload, env.JWT_REFRESH_SECRET, options);
}

/**
 * Generate a pair of tokens (access + refresh) for a user
 */
export function generateTokenPair(userId: string, email: string, role: string): TokenPair {
  const accessToken = generateAccessToken(userId, email, role);
  const refreshToken = generateRefreshToken(userId, email, role);
  
  // Calculate expiration in seconds
  const decodedAccess = jwt.decode(accessToken) as jwt.JwtPayload;
  const expiresIn = decodedAccess.exp ? decodedAccess.exp - Math.floor(Date.now() / 1000) : 0;

  return {
    accessToken,
    refreshToken,
    expiresIn
  };
}

/**
 * Verify a JWT access token
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as TokenPayload;
    if (decoded.type !== 'access') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Verify a JWT refresh token
 */
export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
    if (decoded.type !== 'refresh') {
      return null;
    }
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Check if a token is revoked
 */
export async function isTokenRevoked(jti: string): Promise<boolean> {
  const result = await db.select()
    .from(revokedTokens)
    .where(eq(revokedTokens.jti, jti))
    .get();
  
  return !!result;
}

/**
 * Revoke a refresh token
 */
export async function revokeToken(jti: string, userId: string, expiresAt: Date): Promise<void> {
  await db.insert(revokedTokens)
    .values({
      jti,
      userId,
      expiresAt: expiresAt.toISOString(),
    })
    .onConflictDoNothing()
    .run();
}

/**
 * Clean up expired revoked tokens from the database
 */
export async function cleanupRevokedTokens(): Promise<void> {
  const now = new Date().toISOString();
  
  // Use lt operator from drizzle-orm for comparison
  await db.delete(revokedTokens)
    .where(lt(revokedTokens.expiresAt, now))
    .run();
}

/**
 * Extract token from Authorization header
 */
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  return authHeader.substring(7); // Remove 'Bearer ' prefix
} 