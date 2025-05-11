// Mock dependencies before importing the modules
jest.mock('drizzle-orm', () => ({
  eq: jest.fn().mockReturnValue('mocked-eq-condition'),
  and: jest.fn().mockReturnValue('mocked-and-condition'),
  desc: jest.fn().mockReturnValue('mocked-desc-sort'),
  asc: jest.fn().mockReturnValue('mocked-asc-sort'),
  sql: jest.fn().mockReturnValue('mocked-sql-expression'),
}));

jest.mock('drizzle-orm/sqlite-core', () => {
  const chainable = {
    primaryKey: jest.fn().mockReturnThis(),
    notNull: jest.fn().mockReturnThis(),
    unique: jest.fn().mockReturnThis(),
    $defaultFn: jest.fn().mockReturnThis(),
    default: jest.fn().mockReturnThis(),
    enum: jest.fn().mockReturnThis(),
  };
  return {
    sqliteTable: jest.fn(),
    text: jest.fn(() => chainable),
    integer: jest.fn(() => chainable),
  };
});

// Centralized mock factory for database operations
const createDbMock = () => {
  // Create chainable mock functions that return the mock object itself
  const dbMock = {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  // Setup select chain
  const selectChain = {
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    get: jest.fn(),
  };
  dbMock.select.mockReturnValue(selectChain);

  // Setup insert chain
  const insertChain = {
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    get: jest.fn(),
  };
  dbMock.insert.mockReturnValue(insertChain);

  // Setup update chain
  const updateChain = {
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    get: jest.fn(),
  };
  dbMock.update.mockReturnValue(updateChain);

  // Setup delete chain
  const deleteChain = {
    where: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    execute: jest.fn(),
  };
  dbMock.delete.mockReturnValue(deleteChain);

  return {
    dbMock,
    chains: {
      select: selectChain,
      insert: insertChain,
      update: updateChain,
      delete: deleteChain,
    },
  };
};

// Setup the mock
const { dbMock, chains } = createDbMock();
jest.mock('../../db/config', () => ({
  db: dbMock,
}));

jest.mock('../../auth/utils/password', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed_password'),
  validatePasswordStrength: jest.fn(),
  verifyPassword: jest.fn(),
}));

import { Request, Response } from 'express';
import { db } from '../../db/config';
import { UserRole } from '../../db/schema/users';
import { eq, and, sql } from 'drizzle-orm';
import {
  listUsers,
  createUser,
  getUserById,
  updateUser,
  disableUser,
  getProfile,
  updateProfile,
} from '../controllers/userController';
import {
  hashPassword,
  validatePasswordStrength,
  verifyPassword,
} from '../../auth/utils/password';

// Helper to create mock request and response objects
const mockRequest = (body = {}, user = null, params = {}, query = {}) => {
  return {
    body,
    user,
    params,
    query,
  } as unknown as Request;
};

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe.skip('User Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listUsers', () => {
    it('should return paginated users list for admin', async () => {
      // Arrange
      const req = mockRequest(
        {},
        { role: 'admin' },
        {},
        { page: '1', pageSize: '10' },
      );
      const res = mockResponse();

      const mockUsers = [
        {
          id: 'user1',
          email: 'user1@example.com',
          displayName: 'User 1',
          role: 'user',
        },
        {
          id: 'user2',
          email: 'user2@example.com',
          displayName: 'User 2',
          role: 'admin',
        },
      ];

      const mockCount = { count: 2 };

      // Setup the mock responses
      chains.select.get
        .mockReturnValueOnce(mockCount) // First select for count
        .mockReturnValueOnce(mockUsers); // Second select for users list

      // Act
      await listUsers(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            users: mockUsers,
            pagination: expect.objectContaining({
              page: 1,
              pageSize: 10,
              totalCount: 2,
              totalPages: 1,
            }),
          }),
        }),
      );
    });

    it('should handle errors', async () => {
      // Arrange
      const req = mockRequest({}, { role: 'admin' }, {}, {});
      const res = mockResponse();

      // Force error by making the first select method throw
      const mockError = new Error('Database error');
      chains.select.from.mockImplementationOnce(() => {
        throw mockError;
      });

      // Act
      await listUsers(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Internal server error',
        }),
      );
    });
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      // Arrange
      const req = mockRequest({
        email: 'new@example.com',
        password: 'SecurePassword123!',
        displayName: 'New User',
      });
      const res = mockResponse();

      const mockNewUser = {
        id: 'newuser123',
        email: 'new@example.com',
        displayName: 'New User',
        role: 'user',
        disabled: false,
        createdAt: '2023-01-01T00:00:00.000Z',
      };

      // Setup mocks
      chains.select.get.mockReturnValueOnce(null); // No existing user
      chains.insert.get.mockReturnValueOnce(mockNewUser); // Successfully inserted user

      (validatePasswordStrength as jest.Mock).mockReturnValue({
        isValid: true,
      });

      // Act
      await createUser(req, res);

      // Assert
      expect(hashPassword).toHaveBeenCalledWith('SecurePassword123!');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: 'newuser123',
            email: 'new@example.com',
            displayName: 'New User',
          }),
        }),
      );
    });

    it('should return 400 for missing required fields', async () => {
      // Arrange
      const req = mockRequest({
        email: 'test@example.com',
        // password missing
        displayName: 'Test User',
      });
      const res = mockResponse();

      // Act
      await createUser(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Email, password, and display name are required',
        }),
      );
    });

    it('should return 400 for invalid email format', async () => {
      // Arrange
      const req = mockRequest({
        email: 'invalid-email',
        password: 'Password123!',
        displayName: 'Test User',
      });
      const res = mockResponse();

      // Act
      await createUser(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Invalid email format',
        }),
      );
    });

    it('should return 400 for weak password', async () => {
      // Arrange
      const req = mockRequest({
        email: 'test@example.com',
        password: 'weak',
        displayName: 'Test User',
      });
      const res = mockResponse();

      (validatePasswordStrength as jest.Mock).mockReturnValue({
        isValid: false,
        reason: 'Password must be at least 8 characters long',
      });

      // Act
      await createUser(req, res);

      // Assert
      expect(validatePasswordStrength).toHaveBeenCalledWith('weak');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Password must be at least 8 characters long',
        }),
      );
    });

    it('should return 409 if user already exists', async () => {
      // Arrange
      const req = mockRequest({
        email: 'existing@example.com',
        password: 'Password123!',
        displayName: 'Existing User',
      });
      const res = mockResponse();

      const existingUser = {
        id: 'existing123',
        email: 'existing@example.com',
      };

      // Setup mocks - existing user found
      chains.select.get.mockReturnValueOnce(existingUser);

      (validatePasswordStrength as jest.Mock).mockReturnValue({
        isValid: true,
      });

      // Act
      await createUser(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'User with this email already exists',
        }),
      );
    });
  });

  describe('getUserById', () => {
    it('should return user details for valid ID', async () => {
      // Arrange
      const req = mockRequest({}, { role: 'admin' }, { id: 'user123' });
      const res = mockResponse();

      const mockUser = {
        id: 'user123',
        email: 'user@example.com',
        displayName: 'Test User',
        role: 'user',
      };

      // Setup mocks - user found
      chains.select.get.mockReturnValueOnce(mockUser);

      // Act
      await getUserById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockUser,
        }),
      );
    });

    it('should return 404 for non-existent user', async () => {
      // Arrange
      const req = mockRequest({}, { role: 'admin' }, { id: 'nonexistent' });
      const res = mockResponse();

      // Setup mocks - user not found
      chains.select.get.mockReturnValueOnce(null);

      // Act
      await getUserById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'User not found',
        }),
      );
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      // Arrange
      const req = mockRequest(
        { email: 'updated@example.com', displayName: 'Updated User' },
        { role: 'admin' },
        { id: 'user123' },
      );
      const res = mockResponse();

      const existingUser = {
        id: 'user123',
        email: 'old@example.com',
        displayName: 'Old Name',
        role: 'user',
      };

      const updatedUser = {
        id: 'user123',
        email: 'updated@example.com',
        displayName: 'Updated User',
        role: 'user',
        updatedAt: '2023-01-02T00:00:00.000Z',
      };

      // Setup mocks
      chains.select.get
        .mockReturnValueOnce(existingUser) // First select finds the user
        .mockReturnValueOnce(null); // Second select checks if email exists (it doesn't)

      chains.update.get.mockReturnValueOnce(updatedUser); // Update returns updated user

      // Act
      await updateUser(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            id: 'user123',
            email: 'updated@example.com',
            displayName: 'Updated User',
          }),
        }),
      );
    });

    it('should return 404 for non-existent user', async () => {
      // Arrange
      const req = mockRequest(
        { email: 'new@example.com' },
        { role: 'admin' },
        { id: 'nonexistent' },
      );
      const res = mockResponse();

      // Setup mocks - user not found
      chains.select.get.mockReturnValueOnce(null);

      // Act
      await updateUser(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'User not found',
        }),
      );
    });

    it('should return 409 if email is already taken', async () => {
      // Arrange
      const req = mockRequest(
        { email: 'taken@example.com' },
        { role: 'admin' },
        { id: 'user123' },
      );
      const res = mockResponse();

      const existingUser = {
        id: 'user123',
        email: 'original@example.com',
        displayName: 'Original Name',
      };

      const conflictingUser = {
        id: 'other123',
        email: 'taken@example.com',
      };

      // Setup mocks
      chains.select.get
        .mockReturnValueOnce(existingUser) // First select finds the user
        .mockReturnValueOnce(conflictingUser); // Second select finds conflicting email

      // Act
      await updateUser(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Email is already taken',
        }),
      );
    });
  });

  describe('disableUser', () => {
    it('should disable user successfully', async () => {
      // Arrange
      const req = mockRequest({}, { role: 'admin' }, { id: 'user123' });
      const res = mockResponse();

      const existingUser = {
        id: 'user123',
        email: 'user@example.com',
        disabled: false,
      };

      const updatedUser = {
        id: 'user123',
        email: 'user@example.com',
        disabled: true,
      };

      // Setup mocks
      chains.select.get.mockReturnValueOnce(existingUser); // User found
      chains.update.get.mockReturnValueOnce(updatedUser); // Successfully updated

      // Act
      await disableUser(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: updatedUser,
        }),
      );
    });

    it('should return 404 for non-existent user', async () => {
      // Arrange
      const req = mockRequest({}, { role: 'admin' }, { id: 'nonexistent' });
      const res = mockResponse();

      // Setup mocks - user not found
      chains.select.get.mockReturnValueOnce(null);

      // Act
      await disableUser(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'User not found',
        }),
      );
    });
  });

  describe('getProfile', () => {
    it('should return current user profile', async () => {
      // Arrange
      const userId = 'current123';
      const req = mockRequest({}, { id: userId });
      const res = mockResponse();

      const mockUser = {
        id: userId,
        email: 'current@example.com',
        displayName: 'Current User',
        role: 'user',
      };

      // Setup mocks - user found
      chains.select.get.mockReturnValueOnce(mockUser);

      // Act
      await getProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: mockUser,
        }),
      );
    });

    it('should return 401 if not authenticated', async () => {
      // Arrange
      const req = mockRequest(); // No user object
      const res = mockResponse();

      // Act
      await getProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Authentication required',
        }),
      );
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      // Arrange
      const userId = 'current123';
      const req = mockRequest({ displayName: 'Updated Name' }, { id: userId });
      const res = mockResponse();

      const existingUser = {
        id: userId,
        email: 'current@example.com',
        displayName: 'Current User',
      };

      const updatedUser = {
        id: userId,
        email: 'current@example.com',
        displayName: 'Updated Name',
      };

      // Setup mocks
      chains.select.get.mockReturnValueOnce(existingUser); // User found
      chains.update.get.mockReturnValueOnce(updatedUser); // Successfully updated

      // Act
      await updateProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: updatedUser,
        }),
      );
    });

    it('should handle password update correctly', async () => {
      // Arrange
      const userId = 'current123';
      const req = mockRequest(
        {
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword456!',
        },
        { id: userId },
      );
      const res = mockResponse();

      const existingUser = {
        id: userId,
        email: 'current@example.com',
        passwordHash: 'hashed_old_password',
      };

      const updatedUser = {
        id: userId,
        email: 'current@example.com',
        passwordHash: 'hashed_new_password',
      };

      // Setup mocks
      chains.select.get.mockReturnValueOnce(existingUser); // User found
      chains.update.get.mockReturnValueOnce(updatedUser); // Successfully updated

      // Mock password verification and hashing
      (verifyPassword as jest.Mock).mockResolvedValue(true);
      (hashPassword as jest.Mock).mockResolvedValue('hashed_new_password');

      // Act
      await updateProfile(req, res);

      // Assert
      expect(verifyPassword).toHaveBeenCalledWith(
        'OldPassword123!',
        'hashed_old_password',
      );
      expect(hashPassword).toHaveBeenCalledWith('NewPassword456!');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: updatedUser,
        }),
      );
    });

    it('should return 401 if current password is incorrect', async () => {
      // Arrange
      const userId = 'current123';
      const req = mockRequest(
        {
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword456!',
        },
        { id: userId },
      );
      const res = mockResponse();

      const existingUser = {
        id: userId,
        email: 'current@example.com',
        passwordHash: 'hashed_old_password',
      };

      // Setup mocks
      chains.select.get.mockReturnValueOnce(existingUser); // User found

      // Mock password verification (fails)
      (verifyPassword as jest.Mock).mockResolvedValue(false);

      // Act
      await updateProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Current password is incorrect',
        }),
      );
    });
  });
});
