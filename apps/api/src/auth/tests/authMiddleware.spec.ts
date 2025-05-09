// Mock dependencies before importing the modules
jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
}));

jest.mock('../../db/config', () => {
  const mockDb = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue(null),
  };
  
  // Make all chainable methods properly chainable
  mockDb.select.mockImplementation(() => mockDb);
  mockDb.from.mockImplementation(() => mockDb);
  mockDb.where.mockImplementation(() => mockDb);
  
  return { db: mockDb };
});

jest.mock('../utils/jwt', () => ({
  extractTokenFromHeader: jest.fn(),
  verifyAccessToken: jest.fn(),
  isTokenRevoked: jest.fn(),
}));

jest.mock('../../db/schema/users', () => ({
  users: {}
}));

// Import dependencies after mocking
import { Request, Response, NextFunction } from 'express';
import { authenticate, requireRole, requireAdmin } from '../middleware/authMiddleware';
import { db } from '../../db/config';
import { users } from '../../db/schema/users';
import * as jwtUtils from '../utils/jwt';
import { eq } from 'drizzle-orm';

// Mock request, response, and next function
const mockRequest = (headers = {}, user = null) => {
  const req = {
    headers,
    user,
  } as unknown as Request;
  return req;
};

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn() as unknown as NextFunction;

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should authenticate a user with valid token', async () => {
      // Arrange
      const req = mockRequest({ authorization: 'Bearer valid-token' });
      const res = mockResponse();
      
      const decodedToken = {
        sub: 'user123',
        email: 'test@example.com',
        role: 'user',
        jti: 'token123',
      };

      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        role: 'user',
        disabled: false,
      };

      // Mock function responses
      (jwtUtils.extractTokenFromHeader as jest.Mock).mockReturnValue('valid-token');
      (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue(decodedToken);
      (jwtUtils.isTokenRevoked as jest.Mock).mockResolvedValue(false);
      (db.get as jest.Mock).mockResolvedValue(mockUser);

      // Act
      await authenticate(req, res, mockNext);

      // Assert
      expect(req.user).toEqual({
        id: decodedToken.sub,
        email: decodedToken.email,
        role: decodedToken.role,
      });
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 if no token is provided', async () => {
      // Arrange
      const req = mockRequest({});
      const res = mockResponse();
      
      // Mock function responses
      (jwtUtils.extractTokenFromHeader as jest.Mock).mockReturnValue(null);

      // Act
      await authenticate(req, res, mockNext);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Authentication required',
      }));
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
      // Arrange
      const req = mockRequest({ authorization: 'Bearer invalid-token' });
      const res = mockResponse();
      
      // Mock function responses
      (jwtUtils.extractTokenFromHeader as jest.Mock).mockReturnValue('invalid-token');
      (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue(null);

      // Act
      await authenticate(req, res, mockNext);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Invalid or expired token',
      }));
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if token is revoked', async () => {
      // Arrange
      const req = mockRequest({ authorization: 'Bearer revoked-token' });
      const res = mockResponse();
      
      const decodedToken = {
        sub: 'user123',
        email: 'test@example.com',
        role: 'user',
        jti: 'token123',
      };

      // Mock function responses
      (jwtUtils.extractTokenFromHeader as jest.Mock).mockReturnValue('revoked-token');
      (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue(decodedToken);
      (jwtUtils.isTokenRevoked as jest.Mock).mockResolvedValue(true);

      // Act
      await authenticate(req, res, mockNext);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Token has been revoked',
      }));
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if user does not exist', async () => {
      // Arrange
      const req = mockRequest({ authorization: 'Bearer valid-token' });
      const res = mockResponse();
      
      const decodedToken = {
        sub: 'user123',
        email: 'test@example.com',
        role: 'user',
        jti: 'token123',
      };

      // Mock function responses
      (jwtUtils.extractTokenFromHeader as jest.Mock).mockReturnValue('valid-token');
      (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue(decodedToken);
      (jwtUtils.isTokenRevoked as jest.Mock).mockResolvedValue(false);
      (db.get as jest.Mock).mockResolvedValue(null);

      // Act
      await authenticate(req, res, mockNext);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'User not found or is disabled',
      }));
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 if user is disabled', async () => {
      // Arrange
      const req = mockRequest({ authorization: 'Bearer valid-token' });
      const res = mockResponse();
      
      const decodedToken = {
        sub: 'user123',
        email: 'test@example.com',
        role: 'user',
        jti: 'token123',
      };

      const mockUser = {
        id: 'user123',
        email: 'test@example.com',
        role: 'user',
        disabled: true,
      };

      // Mock function responses
      (jwtUtils.extractTokenFromHeader as jest.Mock).mockReturnValue('valid-token');
      (jwtUtils.verifyAccessToken as jest.Mock).mockReturnValue(decodedToken);
      (jwtUtils.isTokenRevoked as jest.Mock).mockResolvedValue(false);
      (db.get as jest.Mock).mockResolvedValue(mockUser);

      // Act
      await authenticate(req, res, mockNext);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'User not found or is disabled',
      }));
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    it('should allow access if user has the required role', () => {
      // Arrange
      const req = mockRequest({}, { id: 'user123', email: 'test@example.com', role: 'admin' });
      const res = mockResponse();
      const requireAdminRole = requireRole('admin');

      // Act
      requireAdminRole(req, res, mockNext);

      // Assert
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      const requireAdminRole = requireRole('admin');

      // Act
      requireAdminRole(req, res, mockNext);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Authentication required',
      }));
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 if user does not have the required role', () => {
      // Arrange
      const req = mockRequest({}, { id: 'user123', email: 'test@example.com', role: 'user' });
      const res = mockResponse();
      const requireAdminRole = requireRole('admin');

      // Act
      requireAdminRole(req, res, mockNext);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Insufficient permissions',
      }));
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('should allow access if user is an admin', () => {
      // Arrange
      const req = mockRequest({}, { id: 'user123', email: 'test@example.com', role: 'admin' });
      const res = mockResponse();

      // Act
      requireAdmin(req, res, mockNext);

      // Assert - requireAdmin should call next when user has admin role
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 if user is not authenticated', () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();

      // Act
      requireAdmin(req, res, mockNext);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Authentication required',
      }));
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 if user is not an admin', () => {
      // Arrange
      const req = mockRequest({}, { id: 'user123', email: 'test@example.com', role: 'user' });
      const res = mockResponse();

      // Act
      requireAdmin(req, res, mockNext);

      // Assert
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Insufficient permissions',
      }));
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
}); 