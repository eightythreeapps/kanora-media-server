import { Request, Response } from 'express';
import { register, login, refreshToken, logout } from '../controllers/authController';
import { db } from '../../db/config';
import { users } from '../../db/schema/users';
import { revokedTokens } from '../../db/schema/auth';
import * as passwordUtils from '../utils/password';
import * as jwtUtils from '../utils/jwt';

// Mock dependencies
jest.mock('../../db/config', () => ({
  db: {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    get: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    run: jest.fn(),
    delete: jest.fn().mockReturnThis(),
    onConflictDoNothing: jest.fn().mockReturnThis(),
  },
}));

jest.mock('../utils/password', () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
  validatePasswordStrength: jest.fn(),
}));

jest.mock('../utils/jwt', () => ({
  generateTokenPair: jest.fn(),
  verifyRefreshToken: jest.fn(),
  isTokenRevoked: jest.fn(),
  revokeToken: jest.fn(),
}));

// Mock request and response objects
const mockRequest = (body = {}) => ({ body }) as Request;
const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      // Arrange
      const req = mockRequest({
        email: 'test@example.com',
        password: 'StrongP@ss1',
        displayName: 'Test User',
      });
      const res = mockResponse();
      
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'user',
      };

      const mockTokens = {
        accessToken: 'access123',
        refreshToken: 'refresh123',
        expiresIn: 3600,
      };

      // Mock function responses
      (passwordUtils.validatePasswordStrength as jest.Mock).mockReturnValue({ isValid: true });
      (db.select().from().where().get as jest.Mock).mockResolvedValue(null); // No existing user
      (passwordUtils.hashPassword as jest.Mock).mockResolvedValue('hashedpassword');
      (db.insert().values().returning().get as jest.Mock).mockResolvedValue(mockUser);
      (jwtUtils.generateTokenPair as jest.Mock).mockReturnValue(mockTokens);

      // Act
      await register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          user: mockUser,
          ...mockTokens,
        }),
      }));
    });

    it('should return 400 if required fields are missing', async () => {
      // Arrange
      const req = mockRequest({ email: 'test@example.com' }); // Missing password and displayName
      const res = mockResponse();

      // Act
      await register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Email, password, and display name are required',
      }));
    });

    it('should return 400 if email format is invalid', async () => {
      // Arrange
      const req = mockRequest({
        email: 'invalid-email',
        password: 'StrongP@ss1',
        displayName: 'Test User',
      });
      const res = mockResponse();

      // Act
      await register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Invalid email format',
      }));
    });

    it('should return 400 if password is weak', async () => {
      // Arrange
      const req = mockRequest({
        email: 'test@example.com',
        password: 'weak',
        displayName: 'Test User',
      });
      const res = mockResponse();
      
      (passwordUtils.validatePasswordStrength as jest.Mock).mockReturnValue({
        isValid: false,
        reason: 'Password must be at least 8 characters long',
      });

      // Act
      await register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Password must be at least 8 characters long',
      }));
    });

    it('should return 409 if user already exists', async () => {
      // Arrange
      const req = mockRequest({
        email: 'existing@example.com',
        password: 'StrongP@ss1',
        displayName: 'Test User',
      });
      const res = mockResponse();
      
      (passwordUtils.validatePasswordStrength as jest.Mock).mockReturnValue({ isValid: true });
      (db.select().from().where().get as jest.Mock).mockResolvedValue({ id: 'existing' }); // Existing user

      // Act
      await register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'User with this email already exists',
      }));
    });
  });

  describe('login', () => {
    it('should login a user successfully', async () => {
      // Arrange
      const req = mockRequest({
        email: 'test@example.com',
        password: 'Password123!',
      });
      const res = mockResponse();
      
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'user',
        passwordHash: 'hashedpassword',
        disabled: false,
      };

      const mockTokens = {
        accessToken: 'access123',
        refreshToken: 'refresh123',
        expiresIn: 3600,
      };

      // Mock function responses
      (db.select().from().where().get as jest.Mock).mockResolvedValue(mockUser);
      (passwordUtils.verifyPassword as jest.Mock).mockResolvedValue(true);
      (jwtUtils.generateTokenPair as jest.Mock).mockReturnValue(mockTokens);

      // Act
      await login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          user: expect.objectContaining({
            id: mockUser.id,
            email: mockUser.email,
          }),
          ...mockTokens,
        }),
      }));
      expect(db.update().set().where().run).toHaveBeenCalled(); // Last login updated
    });

    it('should return 400 if required fields are missing', async () => {
      // Arrange
      const req = mockRequest({ email: 'test@example.com' }); // Missing password
      const res = mockResponse();

      // Act
      await login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Email and password are required',
      }));
    });

    it('should return 401 if user does not exist', async () => {
      // Arrange
      const req = mockRequest({
        email: 'nonexistent@example.com',
        password: 'Password123!',
      });
      const res = mockResponse();
      
      // Mock function responses
      (db.select().from().where().get as jest.Mock).mockResolvedValue(null);

      // Act
      await login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Invalid credentials',
      }));
    });

    it('should return 401 if password is incorrect', async () => {
      // Arrange
      const req = mockRequest({
        email: 'test@example.com',
        password: 'WrongPassword',
      });
      const res = mockResponse();
      
      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'user',
        passwordHash: 'hashedpassword',
        disabled: false,
      };

      // Mock function responses
      (db.select().from().where().get as jest.Mock).mockResolvedValue(mockUser);
      (passwordUtils.verifyPassword as jest.Mock).mockResolvedValue(false);

      // Act
      await login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Invalid credentials',
      }));
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      // Arrange
      const req = mockRequest({
        refreshToken: 'valid-refresh-token',
      });
      const res = mockResponse();
      
      const decodedToken = {
        sub: 'user123',
        email: 'test@example.com',
        role: 'user',
        jti: 'token123',
        type: 'refresh',
      };

      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        role: 'user',
        disabled: false,
      };

      const mockTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 3600,
      };

      // Mock function responses
      (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue(decodedToken);
      (jwtUtils.isTokenRevoked as jest.Mock).mockResolvedValue(false);
      (db.select().from().where().get as jest.Mock).mockResolvedValue(mockUser);
      (jwtUtils.generateTokenPair as jest.Mock).mockReturnValue(mockTokens);
      jest.spyOn(jwt, 'decode').mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 });

      // Act
      await refreshToken(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockTokens,
      }));
    });

    it('should return 400 if refresh token is missing', async () => {
      // Arrange
      const req = mockRequest({}); // Missing refresh token
      const res = mockResponse();

      // Act
      await refreshToken(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Refresh token is required',
      }));
    });

    it('should return 401 if refresh token is invalid', async () => {
      // Arrange
      const req = mockRequest({
        refreshToken: 'invalid-refresh-token',
      });
      const res = mockResponse();
      
      // Mock function responses
      (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue(null);

      // Act
      await refreshToken(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Invalid refresh token',
      }));
    });

    it('should return 401 if refresh token is revoked', async () => {
      // Arrange
      const req = mockRequest({
        refreshToken: 'revoked-refresh-token',
      });
      const res = mockResponse();
      
      const decodedToken = {
        sub: 'user123',
        email: 'test@example.com',
        role: 'user',
        jti: 'token123',
        type: 'refresh',
      };

      // Mock function responses
      (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue(decodedToken);
      (jwtUtils.isTokenRevoked as jest.Mock).mockResolvedValue(true);

      // Act
      await refreshToken(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Refresh token has been revoked',
      }));
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      // Arrange
      const req = mockRequest({
        refreshToken: 'valid-refresh-token',
      });
      const res = mockResponse();
      
      const decodedToken = {
        sub: 'user123',
        email: 'test@example.com',
        role: 'user',
        jti: 'token123',
        type: 'refresh',
      };

      // Mock function responses
      (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue(decodedToken);
      jest.spyOn(jwt, 'decode').mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 3600 });

      // Act
      await logout(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: { message: 'Logged out successfully' },
      }));
      expect(jwtUtils.revokeToken).toHaveBeenCalledWith(decodedToken.jti, decodedToken.sub, expect.any(Date));
    });

    it('should return 400 if refresh token is missing', async () => {
      // Arrange
      const req = mockRequest({}); // Missing refresh token
      const res = mockResponse();

      // Act
      await logout(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Refresh token is required',
      }));
    });

    it('should return 200 even if refresh token is invalid', async () => {
      // Arrange
      const req = mockRequest({
        refreshToken: 'invalid-refresh-token',
      });
      const res = mockResponse();
      
      // Mock function responses
      (jwtUtils.verifyRefreshToken as jest.Mock).mockReturnValue(null);

      // Act
      await logout(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: { message: 'Logged out successfully' },
      }));
      // Token should not be revoked if it's invalid
      expect(jwtUtils.revokeToken).not.toHaveBeenCalled();
    });
  });
}); 