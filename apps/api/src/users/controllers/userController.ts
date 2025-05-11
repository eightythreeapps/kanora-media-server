import { Request, Response } from 'express';
import { db } from '../../db/config';
import { users, UserRole } from '../../db/schema/users';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { ApiResponse } from '@kanora/shared-types';
import { hashPassword, validatePasswordStrength, verifyPassword } from '../../auth/utils/password';

// Default page size for pagination
const DEFAULT_PAGE_SIZE = 20;

/**
 * List all users (admin only)
 */
export async function listUsers(req: Request, res: Response) {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || DEFAULT_PAGE_SIZE;
    const sortBy = (req.query.sortBy as string) || 'createdAt';
    const sortOrder = (req.query.sortOrder as string)?.toLowerCase() === 'asc' ? 'asc' : 'desc';
    
    // Calculate offset for pagination
    const offset = (page - 1) * pageSize;
    
    // Define allowed sort fields
    const allowedSortFields = ['email', 'displayName', 'role', 'createdAt', 'lastLogin', 'disabled'];
    const validSortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    
    // Fetch users with pagination
    const usersList = await db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        disabled: users.disabled,
        lastLogin: users.lastLogin,
        createdAt: users.createdAt
      })
      .from(users)
      .orderBy(sortOrder === 'asc' 
        ? validSortField === 'email' ? asc(users.email)
        : validSortField === 'displayName' ? asc(users.displayName)
        : validSortField === 'role' ? asc(users.role)
        : validSortField === 'lastLogin' ? asc(users.lastLogin)
        : validSortField === 'disabled' ? asc(users.disabled)
        : asc(users.createdAt)
        : validSortField === 'email' ? desc(users.email)
        : validSortField === 'displayName' ? desc(users.displayName)
        : validSortField === 'role' ? desc(users.role)
        : validSortField === 'lastLogin' ? desc(users.lastLogin)
        : validSortField === 'disabled' ? desc(users.disabled)
        : desc(users.createdAt)
      )
      .limit(pageSize)
      .offset(offset);
    
    // Get total count for pagination metadata
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .get();
    
    const totalCount = countResult?.count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);
    
    return res.status(200).json({
      success: true,
      data: {
        users: usersList,
        pagination: {
          page,
          pageSize,
          totalCount,
          totalPages
        }
      },
      timestamp: new Date().toISOString()
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error listing users:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
}

/**
 * Create a new user (admin only)
 */
export async function createUser(req: Request, res: Response) {
  try {
    const { email, password, displayName, role } = req.body;
    
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
    
    // Validate role if provided
    const userRole = role ? role : UserRole.USER;
    if (role && !Object.values(UserRole).includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    // Check if user already exists
    const existingUser = await db
      .select()
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
    const newUser = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        displayName,
        role: userRole
      })
      .returning()
      .get();
    
    return res.status(201).json({
      success: true,
      data: {
        id: newUser.id,
        email: newUser.email,
        displayName: newUser.displayName,
        role: newUser.role,
        disabled: newUser.disabled,
        createdAt: newUser.createdAt
      },
      timestamp: new Date().toISOString()
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
}

/**
 * Get a user by ID (admin only)
 */
export async function getUserById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        disabled: users.disabled,
        lastLogin: users.lastLogin,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      })
      .from(users)
      .where(eq(users.id, id))
      .get();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    return res.status(200).json({
      success: true,
      data: user,
      timestamp: new Date().toISOString()
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error getting user:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
}

/**
 * Update a user by ID (admin only)
 */
export async function updateUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { email, displayName, role, disabled, password } = req.body;
    
    // Find user
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .get();
    
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };
    
    // Only update fields that are provided
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
      }
      
      // Check if email is already taken by another user
      if (email !== existingUser.email) {
        const emailExists = await db
          .select()
          .from(users)
          .where(and(eq(users.email, email), sql`${users.id} != ${id}`))
          .get();
        
        if (emailExists) {
          return res.status(409).json({
            success: false,
            error: 'Email is already taken',
            timestamp: new Date().toISOString()
          } as ApiResponse<null>);
        }
      }
      
      updateData.email = email;
    }
    
    if (displayName !== undefined) {
      updateData.displayName = displayName;
    }
    
    if (role !== undefined) {
      if (!Object.values(UserRole).includes(role)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid role',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
      }
      updateData.role = role;
    }
    
    if (disabled !== undefined) {
      updateData.disabled = disabled;
    }
    
    if (password !== undefined) {
      const passwordValidation = validatePasswordStrength(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: passwordValidation.reason,
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
      }
      updateData.passwordHash = await hashPassword(password);
    }
    
    // Update user
    const updatedUser = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning()
      .get();
    
    return res.status(200).json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        role: updatedUser.role,
        disabled: updatedUser.disabled,
        lastLogin: updatedUser.lastLogin,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      },
      timestamp: new Date().toISOString()
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
}

/**
 * Disable a user by ID (admin only)
 */
export async function disableUser(req: Request, res: Response) {
  try {
    const { id } = req.params;
    
    // Find user
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .get();
    
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    // Update user
    await db
      .update(users)
      .set({
        disabled: true,
        updatedAt: new Date().toISOString()
      })
      .where(eq(users.id, id))
      .run();
    
    return res.status(200).json({
      success: true,
      data: {
        message: 'User disabled successfully'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error disabling user:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
}

/**
 * Get current user profile
 */
export async function getProfile(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        lastLogin: users.lastLogin,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.id, userId))
      .get();
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    return res.status(200).json({
      success: true,
      data: user,
      timestamp: new Date().toISOString()
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error getting profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
}

/**
 * Update current user profile
 */
export async function updateProfile(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    const { email, displayName, currentPassword, newPassword } = req.body;
    
    // Find user
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .get();
    
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    // Prepare update data
    const updateData: any = {
      updatedAt: new Date().toISOString()
    };
    
    // For email update
    if (email !== undefined && email !== existingUser.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
      }
      
      // Check if email is already taken
      const emailExists = await db
        .select()
        .from(users)
        .where(and(eq(users.email, email), sql`${users.id} != ${userId}`))
        .get();
      
      if (emailExists) {
        return res.status(409).json({
          success: false,
          error: 'Email is already taken',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
      }
      
      updateData.email = email;
    }
    
    // For display name update
    if (displayName !== undefined) {
      updateData.displayName = displayName;
    }
    
    // For password update
    let passwordChanged = false;
    if (newPassword !== undefined) {
      // Current password is required for password change
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          error: 'Current password is required to change password',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
      }
      
      // Verify current password
      const isCurrentPasswordValid = await verifyPassword(
        currentPassword,
        existingUser.passwordHash
      );
      
      if (!isCurrentPasswordValid) {
        return res.status(401).json({
          success: false,
          error: 'Current password is incorrect',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
      }
      
      // Validate new password strength
      const passwordValidation = validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: passwordValidation.reason,
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
      }
      
      updateData.passwordHash = await hashPassword(newPassword);
      passwordChanged = true;
    }
    
    // Update user
    const updatedUser = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning()
      .get();
    
    return res.status(200).json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        passwordChanged,
        message: passwordChanged
          ? 'Profile updated successfully. Please login again with your new password.'
          : 'Profile updated successfully.'
      },
      timestamp: new Date().toISOString()
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error updating profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
} 