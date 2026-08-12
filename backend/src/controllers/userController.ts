import { Response } from 'express';
import { UserService } from '../services/userService';
import { PasswordUtils } from '../utils/password';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { registerSchema, updateUserSchema, updateUserStatusSchema } from '../validators';

function stripPassword<T extends { password_hash?: string }>(user: T) {
  const { password_hash, ...rest } = user;
  return rest;
}

export const getAllUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await UserService.getAllUsers();
    res.status(200).json({
      success: true,
      data: users.map(stripPassword),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getUserById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      throw new AppError('Invalid user ID', 400);
    }

    const user = await UserService.getUserById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      data: stripPassword(user),
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};

export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const existingUser = await UserService.getUserByEmail(value.email);
    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    if (!PasswordUtils.validatePasswordStrength(value.password)) {
      throw new AppError(
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        400
      );
    }

    const passwordHash = await PasswordUtils.hashPassword(value.password);
    const user = await UserService.createUser({
      ...value,
      password: passwordHash,
      role: value.role || 'sales',
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: stripPassword(user),
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};

export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      throw new AppError('Invalid user ID', 400);
    }

    const { error, value } = updateUserSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const existing = await UserService.getUserById(userId);
    if (!existing) {
      throw new AppError('User not found', 404);
    }

    if (value.email && value.email !== existing.email) {
      const emailTaken = await UserService.getUserByEmail(value.email);
      if (emailTaken) {
        throw new AppError('User with this email already exists', 409);
      }
    }

    const updated = await UserService.updateUser(userId, value);
    if (!updated) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: stripPassword(updated),
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};

export const updateUserStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = parseInt(req.params.id, 10);
    if (isNaN(userId)) {
      throw new AppError('Invalid user ID', 400);
    }

    const { error, value } = updateUserStatusSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    if (req.user?.id === userId && value.is_active === false) {
      throw new AppError('You cannot deactivate your own account', 409);
    }

    const existing = await UserService.getUserById(userId);
    if (!existing) {
      throw new AppError('User not found', 404);
    }

    const updated = await UserService.setUserActive(userId, value.is_active);
    if (!updated) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      message: value.is_active ? 'User activated successfully' : 'User deactivated successfully',
      data: stripPassword(updated),
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
};
