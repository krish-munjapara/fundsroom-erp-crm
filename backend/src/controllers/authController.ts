import { Response } from 'express';
import { UserService } from '../services/userService';
import { PasswordUtils } from '../utils/password';
import { JwtUtils } from '../utils/jwt';
import { CreateUserDto, LoginDto, AuthResponse } from '../types';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { registerSchema, loginSchema } from '../validators/authValidator';

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate request body
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const userData: CreateUserDto = value;

    // Only admins can register users; default role is sales when omitted
    if (!userData.role) {
      userData.role = 'sales';
    }

    // Check if user already exists
    const existingUser = await UserService.getUserByEmail(userData.email);
    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Validate password strength
    if (!PasswordUtils.validatePasswordStrength(userData.password)) {
      throw new AppError(
        'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character',
        400
      );
    }

    // Hash password
    const passwordHash = await PasswordUtils.hashPassword(userData.password);
    userData.password = passwordHash;

    // Create user
    const user = await UserService.createUser(userData);

    // Generate JWT token
    const token = JwtUtils.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user;

    const response: AuthResponse = {
      success: true,
      message: 'User registered successfully',
      data: {
        user: userWithoutPassword,
        token,
      },
    };

    res.status(201).json(response);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Validate request body
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const loginData: LoginDto = value;

    // Find user by email
    const user = await UserService.getUserByEmail(loginData.email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if user is active
    if (!user.is_active) {
      throw new AppError('User account is inactive', 403);
    }

    // Verify password
    const isPasswordValid = await PasswordUtils.comparePassword(
      loginData.password,
      user.password_hash
    );

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate JWT token
    const token = JwtUtils.generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user;

    const response: AuthResponse = {
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutPassword,
        token,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
};

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const user = await UserService.getUserById(req.user.id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Remove password from response
    const { password_hash, ...userWithoutPassword } = user;

    res.status(200).json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
};
