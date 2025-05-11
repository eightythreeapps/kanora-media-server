// Mock dependencies before importing the modules
jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  and: jest.fn(),
  desc: jest.fn(),
  asc: jest.fn(),
  sql: jest.fn()
}));

jest.mock('drizzle-orm/sqlite-core', () => {
  const chainable = {
    primaryKey: jest.fn().mockReturnThis(),
    notNull: jest.fn().mockReturnThis(),
    unique: jest.fn().mockReturnThis(),
    $defaultFn: jest.fn().mockReturnThis(),
    default: jest.fn().mockReturnThis(),
    enum: jest.fn().mockReturnThis()
  };
  return {
    sqliteTable: jest.fn(),
    text: jest.fn(() => chainable),
    integer: jest.fn(() => chainable)
  };
});

jest.mock('../../db/config', () => {
  // Create a chainable mock for query builders
  const chainable = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    get: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    run: jest.fn(),
    delete: jest.fn().mockReturnThis(),
    onConflictDoNothing: jest.fn().mockReturnThis()
  };
  return { db: chainable };
});

jest.mock('../../auth/utils/password', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed_password'),
  validatePasswordStrength: jest.fn(),
  verifyPassword: jest.fn()
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
  updateProfile
} from '../controllers/userController';
import { hashPassword, validatePasswordStrength, verifyPassword } from '../../auth/utils/password';

// Helper to create mock request and response objects
const mockRequest = (body = {}, user = null, params = {}, query = {}) => {
  return {
    body,
    user,
    params,
    query
  } as unknown as Request;
};

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('User Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('listUsers', () => {
    it('should return paginated users list for admin', async () => {
      // Arrange
      const req = mockRequest({}, { role: 'admin' }, {}, { page: '1', pageSize: '10' });
      const res = mockResponse();
      const mockUsers = [
        { id: 'user1', email: 'user1@example.com', displayName: 'User 1', role: 'user' },
        { id: 'user2', email: 'user2@example.com', displayName: 'User 2', role: 'admin' }
      ];
      const mockCount = { count: 2 };
      
      (db.select(undefined).from(undefined).where(undefined).get as unknown as jest.Mock).mockImplementation(() => {
        return mockCount;
      });
      (db.select(undefined).from(undefined) as unknown as jest.Mock).mockImplementation(() => {
        return mockUsers;
      });
      
      // Act
      await listUsers(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          users: mockUsers,
          pagination: expect.objectContaining({
            page: 1,
            pageSize: 10,
            totalCount: 2,
            totalPages: 1
          })
        })
      }));
    });

    it('should handle errors', async () => {
      // Arrange
      const req = mockRequest();
      const res = mockResponse();
      const mockError = new Error('Database error');
      
      (db.select(undefined).from(undefined).where(undefined).get as unknown as jest.Mock).mockImplementation(() => {
        throw mockError;
      });
      
      // Act
      await listUsers(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Internal server error'
      }));
    });
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      // Arrange
      const req = mockRequest({
        email: 'new@example.com',
        password: 'SecurePassword123!',
        displayName: 'New User'
      });
      const res = mockResponse();
      const mockNewUser = {
        id: 'newuser123',
        email: 'new@example.com',
        displayName: 'New User',
        role: 'user',
        disabled: false,
        createdAt: '2023-01-01T00:00:00.000Z'
      };
      
      (validatePasswordStrength as jest.Mock).mockReturnValue({ isValid: true });
      (db.select(undefined).from(undefined).where(undefined).get as unknown as jest.Mock).mockImplementation(() => {
        return null; // User doesn't exist
      });
      (db.insert(undefined).values({}).returning(undefined).get as unknown as jest.Mock).mockImplementation(() => {
        return mockNewUser;
      });
      
      // Act
      await createUser(req, res);
      
      // Assert
      expect(hashPassword).toHaveBeenCalledWith('SecurePassword123!');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          id: 'newuser123',
          email: 'new@example.com',
          displayName: 'New User'
        })
      }));
    });

    it('should return 400 for missing required fields', async () => {
      // Arrange
      const req = mockRequest({
        email: 'test@example.com',
        // password missing
        displayName: 'Test User'
      });
      const res = mockResponse();
      
      // Act
      await createUser(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Email, password, and display name are required'
      }));
    });

    it('should return 400 for invalid email format', async () => {
      // Arrange
      const req = mockRequest({
        email: 'invalid-email',
        password: 'Password123!',
        displayName: 'Test User'
      });
      const res = mockResponse();
      
      // Act
      await createUser(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Invalid email format'
      }));
    });

    it('should return 400 for weak password', async () => {
      // Arrange
      const req = mockRequest({
        email: 'test@example.com',
        password: 'weak',
        displayName: 'Test User'
      });
      const res = mockResponse();
      
      (validatePasswordStrength as jest.Mock).mockReturnValue({ 
        isValid: false, 
        reason: 'Password must be at least 8 characters long' 
      });
      
      // Act
      await createUser(req, res);
      
      // Assert
      expect(validatePasswordStrength).toHaveBeenCalledWith('weak');
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Password must be at least 8 characters long'
      }));
    });

    it('should return 409 if user already exists', async () => {
      // Arrange
      const req = mockRequest({
        email: 'existing@example.com',
        password: 'Password123!',
        displayName: 'Existing User'
      });
      const res = mockResponse();
      const existingUser = { 
        id: 'existing123',
        email: 'existing@example.com'
      };
      
      (validatePasswordStrength as jest.Mock).mockReturnValue({ isValid: true });
      (db.select(undefined).from(undefined).where(undefined).get as unknown as jest.Mock).mockImplementation(() => {
        return existingUser;
      });
      
      // Act
      await createUser(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'User with this email already exists'
      }));
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
        disabled: false,
        lastLogin: '2023-01-01T00:00:00.000Z',
        createdAt: '2022-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };
      
      (db.select(undefined).from(undefined).where(undefined).get as unknown as jest.Mock).mockImplementation(() => {
        return mockUser;
      });
      
      // Act
      await getUserById(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockUser
      }));
    });

    it('should return 404 for non-existent user', async () => {
      // Arrange
      const req = mockRequest({}, { role: 'admin' }, { id: 'nonexistent' });
      const res = mockResponse();
      
      (db.select(undefined).from(undefined).where(undefined).get as unknown as jest.Mock).mockImplementation(() => {
        return null;
      });
      
      // Act
      await getUserById(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'User not found'
      }));
    });
  });

  describe('updateUser', () => {
    it('should update user successfully', async () => {
      // Arrange
      const req = mockRequest(
        {
          email: 'updated@example.com',
          displayName: 'Updated Name',
          role: 'admin'
        },
        { role: 'admin' },
        { id: 'user123' }
      );
      const res = mockResponse();
      const existingUser = {
        id: 'user123',
        email: 'original@example.com',
        displayName: 'Original Name',
        role: 'user'
      };
      const updatedUser = {
        id: 'user123',
        email: 'updated@example.com',
        displayName: 'Updated Name',
        role: 'admin',
        disabled: false,
        lastLogin: null,
        createdAt: '2022-01-01T00:00:00.000Z',
        updatedAt: '2023-01-01T00:00:00.000Z'
      };
      
      (db.select(undefined).from(undefined).where(undefined).get as unknown as jest.Mock).mockImplementationOnce(() => {
        return existingUser;
      }).mockImplementationOnce(() => {
        return null;
      }).mockImplementationOnce(() => {
        return updatedUser;
      });
      
      // Act
      await updateUser(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          email: 'updated@example.com',
          displayName: 'Updated Name',
          role: 'admin'
        })
      }));
    });

    it('should return 404 for non-existent user', async () => {
      // Arrange
      const req = mockRequest(
        { displayName: 'New Name' },
        { role: 'admin' },
        { id: 'nonexistent' }
      );
      const res = mockResponse();
      
      (db.select(undefined).from(undefined).where(undefined).get as unknown as jest.Mock).mockImplementation(() => {
        return null;
      });
      
      // Act
      await updateUser(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'User not found'
      }));
    });

    it('should return 409 if email is already taken', async () => {
      // Arrange
      const req = mockRequest(
        { email: 'taken@example.com' },
        { role: 'admin' },
        { id: 'user123' }
      );
      const res = mockResponse();
      const existingUser = {
        id: 'user123',
        email: 'original@example.com',
        displayName: 'Original Name',
        role: 'user'
      };
      const emailTakenUser = {
        id: 'another123',
        email: 'taken@example.com'
      };
      
      (db.select(undefined).from(undefined).where(undefined).get as unknown as jest.Mock).mockImplementationOnce(() => {
        return existingUser;
      }).mockImplementationOnce(() => {
        return emailTakenUser;
      });
      
      // Act
      await updateUser(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Email is already taken'
      }));
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
        disabled: false
      };
      
      (db.select(undefined).from(undefined).where(undefined).get as unknown as jest.Mock).mockImplementation(() => {
        return existingUser;
      });
      
      // Act
      await disableUser(req, res);
      
      // Assert
      expect(db.update(undefined).set({}).where(undefined).returning(undefined).get as unknown as jest.Mock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          message: 'User disabled successfully'
        })
      }));
    });

    it('should return 404 for non-existent user', async () => {
      // Arrange
      const req = mockRequest({}, { role: 'admin' }, { id: 'nonexistent' });
      const res = mockResponse();
      
      (db.select(undefined).from(undefined).where(undefined).get as unknown as jest.Mock).mockImplementation(() => {
        return null;
      });
      
      // Act
      await disableUser(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'User not found'
      }));
    });
  });

  describe('getProfile', () => {
    it('should return current user profile', async () => {
      // Arrange
      const req = mockRequest({}, { id: 'user123' });
      const res = mockResponse();
      const mockUser = {
        id: 'user123',
        email: 'user@example.com',
        displayName: 'Current User',
        role: 'user',
        lastLogin: '2023-01-01T00:00:00.000Z',
        createdAt: '2022-01-01T00:00:00.000Z'
      };
      
      (db.select(undefined).from(undefined).where(undefined).get as unknown as jest.Mock).mockImplementation(() => {
        return mockUser;
      });
      
      // Act
      await getProfile(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: mockUser
      }));
    });

    it('should return 401 if not authenticated', async () => {
      // Arrange
      const req = mockRequest(); // No user object
      const res = mockResponse();
      
      // Act
      await getProfile(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Authentication required'
      }));
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      // Arrange
      const req = mockRequest(
        {
          displayName: 'New Display Name',
          email: 'new@example.com'
        },
        { id: 'user123' }
      );
      const res = mockResponse();
      const existingUser = {
        id: 'user123',
        email: 'old@example.com',
        displayName: 'Old Name',
        passwordHash: 'hashed_old_password'
      };
      const updatedUser = {
        id: 'user123',
        email: 'new@example.com',
        displayName: 'New Display Name'
      };
      
      (db.select(undefined).from(undefined).where(undefined).get as unknown as jest.Mock).mockImplementationOnce(() => {
        return existingUser;
      }).mockImplementationOnce(() => {
        return null;
      }).mockImplementationOnce(() => {
        return updatedUser;
      });
      
      // Act
      await updateProfile(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          email: 'new@example.com',
          displayName: 'New Display Name',
          passwordChanged: false
        })
      }));
    });

    it('should handle password update correctly', async () => {
      // Arrange
      const req = mockRequest(
        {
          currentPassword: 'OldPassword123!',
          newPassword: 'NewPassword456!'
        },
        { id: 'user123' }
      );
      const res = mockResponse();
      const existingUser = {
        id: 'user123',
        email: 'user@example.com',
        displayName: 'User Name',
        passwordHash: 'hashed_old_password'
      };
      const updatedUser = {
        id: 'user123',
        email: 'user@example.com',
        displayName: 'User Name'
      };
      
      (verifyPassword as jest.Mock).mockResolvedValue(true);
      (validatePasswordStrength as jest.Mock).mockReturnValue({ isValid: true });
      (db.select(undefined).from(undefined).where(undefined).get as unknown as jest.Mock).mockImplementationOnce(() => {
        return existingUser;
      }).mockImplementationOnce(() => {
        return updatedUser;
      });
      
      // Act
      await updateProfile(req, res);
      
      // Assert
      expect(verifyPassword).toHaveBeenCalledWith('OldPassword123!', 'hashed_old_password');
      expect(hashPassword).toHaveBeenCalledWith('NewPassword456!');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          passwordChanged: true,
          message: 'Profile updated successfully. Please login again with your new password.'
        })
      }));
    });

    it('should return 401 if current password is incorrect', async () => {
      // Arrange
      const req = mockRequest(
        {
          currentPassword: 'WrongPassword',
          newPassword: 'NewPassword123!'
        },
        { id: 'user123' }
      );
      const res = mockResponse();
      const existingUser = {
        id: 'user123',
        passwordHash: 'hashed_real_password'
      };
      
      (db.select(undefined).from(undefined).where(undefined).get as unknown as jest.Mock).mockImplementation(() => {
        return existingUser;
      });
      (verifyPassword as jest.Mock).mockResolvedValue(false); // Password verification fails
      
      // Act
      await updateProfile(req, res);
      
      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: 'Current password is incorrect'
      }));
    });
  });
}); 