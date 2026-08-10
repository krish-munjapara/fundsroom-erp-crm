import { Response } from 'express';
import { DashboardService } from '../services/dashboardService';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { dashboardParamsSchema } from '../validators';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await DashboardService.getDashboardStats();

    res.status(200).json({
      success: true,
      data: stats,
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

export const getRecentOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = dashboardParamsSchema.validate(req.query);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const orders = await DashboardService.getRecentOrders(value.limit);

    res.status(200).json({
      success: true,
      data: orders,
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

export const getRecentActivities = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = dashboardParamsSchema.validate(req.query);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const activities = await DashboardService.getRecentActivities(value.limit);

    res.status(200).json({
      success: true,
      data: activities,
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

export const getOrderStatusSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const summary = await DashboardService.getOrderStatusSummary();

    res.status(200).json({
      success: true,
      data: summary,
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
