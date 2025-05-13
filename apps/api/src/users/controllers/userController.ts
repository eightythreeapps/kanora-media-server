import { Request, Response } from 'express';
import { db } from '../../db/config';
import { users, UserRole } from '../../db/schema/users';
import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { ApiResponse } from '@kanora/shared-types';
import { hashPin, validatePin, verifyPin } from '../../auth/utils/pin';

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
    const allowedSortFields = ['username', 'displayName', 'role', 'createdAt', 'lastLogin', 'disabled'];
    const validSortField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    
    // Fetch users with pagination
    const usersList = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        hasPin: sql<boolean>`${users.pinHash} IS NOT NULL`,
        disabled: users.disabled,
        lastLogin: users.lastLogin,
        createdAt: users.createdAt
      })
      .from(users)
      .orderBy(sortOrder === 'asc' 
        ? validSortField === 'username' ? asc(users.username)
        : validSortField === 'displayName' ? asc(users.displayName)
        : validSortField === 'role' ? asc(users.role)
        : validSortField === 'lastLogin' ? asc(users.lastLogin)
        : validSortField === 'disabled' ? asc(users.disabled)
        : asc(users.createdAt)
        : validSortField === 'username' ? desc(users.username)
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
    const { username, email, displayName, role, pin } = req.body;
    
    // Validate required fields
    if (!username || !displayName) {
      return res.status(400).json({
        success: false,
        error: 'Username and display name are required',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    // Validate username format (alphanumeric with underscores, no spaces)
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        success: false,
        error: 'Username must contain only letters, numbers, and underscores',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
      }
    }
    
    // Validate PIN if provided
    let pinHash = undefined;
    if (pin) {
      const pinValidation = validatePin(pin);
      if (!pinValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: pinValidation.reason,
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
      }
      
      // Hash the PIN
      pinHash = await hashPin(pin);
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
      .where(eq(users.username, username))
      .get();
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this username already exists',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    // Create the user
    const newUser = await db
      .insert(users)
      .values({
        username,
        email,
        pinHash,
        displayName,
        role: userRole
      })
      .returning()
      .get();
    
    return res.status(201).json({
      success: true,
      data: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        displayName: newUser.displayName,
        hasPin: !!newUser.pinHash,
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
        username: users.username,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        hasPin: sql<boolean>`${users.pinHash} IS NOT NULL`,
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
    const { username, email, displayName, role, disabled, pin, removePin } = req.body;
    
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
    
    // Check if username is being changed and if so, make sure it's unique
    if (username && username !== existingUser.username) {
      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      if (!usernameRegex.test(username)) {
        return res.status(400).json({
          success: false,
          error: 'Username must contain only letters, numbers, and underscores',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
      }
      
      // Check if username is unique
      const usernameExists = await db
        .select()
        .from(users)
        .where(and(
          eq(users.username, username),
          sql`${users.id} != ${id}`
        ))
        .get();
      
      if (usernameExists) {
        return res.status(409).json({
          success: false,
          error: 'Username is already taken',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
      }
    }
    
    // Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
      }
    }
    
    // Validate role if provided
    if (role && !Object.values(UserRole).includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid role',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    // Prepare update values
    const updateValues: any = {
      updatedAt: new Date().toISOString()
    };
    
    if (username) updateValues.username = username;
    if (email !== undefined) updateValues.email = email;
    if (displayName) updateValues.displayName = displayName;
    if (role) updateValues.role = role;
    if (disabled !== undefined) updateValues.disabled = disabled;
    
    // Handle PIN changes
    if (pin) {
      // Validate PIN
      const pinValidation = validatePin(pin);
      if (!pinValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: pinValidation.reason,
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
      }
      
      // Hash the PIN
      updateValues.pinHash = await hashPin(pin);
    } else if (removePin) {
      // Remove PIN
      updateValues.pinHash = null;
    }
    
    // Update the user
    const updatedUser = await db
      .update(users)
      .set(updateValues)
      .where(eq(users.id, id))
      .returning()
      .get();
    
    return res.status(200).json({
      success: true,
      data: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        hasPin: !!updatedUser.pinHash,
        role: updatedUser.role,
        disabled: updatedUser.disabled,
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
    
    // Prevent disabling your own account
    if (req.user?.id === id) {
      return res.status(403).json({
        success: false,
        error: 'Cannot disable your own account',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    // Disable the user
    const updatedUser = await db
      .update(users)
      .set({
        disabled: true,
        updatedAt: new Date().toISOString()
      })
      .where(eq(users.id, id))
      .returning()
      .get();
    
    return res.status(200).json({
      success: true,
      data: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        role: updatedUser.role,
        disabled: updatedUser.disabled,
        updatedAt: updatedUser.updatedAt
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
 * Get the current user's profile
 */
export async function getProfile(req: Request, res: Response) {
  try {
    // Get user ID from the authenticated request
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    // Fetch the user's profile
    const userProfile = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        displayName: users.displayName,
        role: users.role,
        hasPin: sql<boolean>`${users.pinHash} IS NOT NULL`,
        lastLogin: users.lastLogin,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.id, userId))
      .get();
    
    if (!userProfile) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    return res.status(200).json({
      success: true,
      data: userProfile,
      timestamp: new Date().toISOString()
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error getting user profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
}

/**
 * Update the current user's profile
 */
export async function updateProfile(req: Request, res: Response) {
  try {
    // Get user ID from the authenticated request
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    const { displayName, email, currentPin, newPin, removePin } = req.body;
    
    // Get the current user
    const currentUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .get();
    
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    // Prepare update values
    const updateValues: any = {
      updatedAt: new Date().toISOString()
    };
    
    // Update display name if provided
    if (displayName) {
      updateValues.displayName = displayName;
    }
    
    // Update email if provided and valid
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format',
          timestamp: new Date().toISOString()
        } as ApiResponse<null>);
      }
      updateValues.email = email;
    }
    
    // Handle PIN changes
    if (newPin || removePin) {
      // If user has a PIN, require the current PIN for verification
      if (currentUser.pinHash) {
        if (!currentPin) {
          return res.status(400).json({
            success: false,
            error: 'Current PIN is required',
            timestamp: new Date().toISOString()
          } as ApiResponse<null>);
        }
        
        // Verify current PIN
        const isPinValid = await verifyPin(currentPin, currentUser.pinHash);
        if (!isPinValid) {
          return res.status(401).json({
            success: false,
            error: 'Invalid current PIN',
            timestamp: new Date().toISOString()
          } as ApiResponse<null>);
        }
      }
      
      if (newPin) {
        // Validate new PIN
        const pinValidation = validatePin(newPin);
        if (!pinValidation.isValid) {
          return res.status(400).json({
            success: false,
            error: pinValidation.reason,
            timestamp: new Date().toISOString()
          } as ApiResponse<null>);
        }
        
        // Hash the new PIN
        updateValues.pinHash = await hashPin(newPin);
      } else if (removePin) {
        // Remove PIN
        updateValues.pinHash = null;
      }
    }
    
    // Only update if there are changes
    if (Object.keys(updateValues).length <= 1) { // 1 because updatedAt is always included
      return res.status(400).json({
        success: false,
        error: 'No changes to update',
        timestamp: new Date().toISOString()
      } as ApiResponse<null>);
    }
    
    // Update the user
    const updatedUser = await db
      .update(users)
      .set(updateValues)
      .where(eq(users.id, userId))
      .returning()
      .get();
    
    return res.status(200).json({
      success: true,
      data: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        displayName: updatedUser.displayName,
        hasPin: !!updatedUser.pinHash,
        role: updatedUser.role,
        updatedAt: updatedUser.updatedAt
      },
      timestamp: new Date().toISOString()
    } as ApiResponse<any>);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    } as ApiResponse<null>);
  }
} 