import { Response } from 'express';
import { DashboardService } from '../services/dashboardService';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { dashboardParamsSchema } from '../validators';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const period = (req.query.period as string) || 'all';
    const startDate = req.query.start_date as string | undefined;
    const endDate = req.query.end_date as string | undefined;
    const stats = await DashboardService.getDashboardStats(period, startDate, endDate);

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

export const getSalesTrend = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const period = (req.query.period as string) || 'month';
    const startDate = req.query.start_date as string | undefined;
    const endDate = req.query.end_date as string | undefined;
    const trend = await DashboardService.getSalesTrend(period, startDate, endDate);

    res.status(200).json({
      success: true,
      data: trend,
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

export const getTopProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const products = await DashboardService.getTopProducts(limit);

    res.status(200).json({
      success: true,
      data: products,
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

export const getLowStockProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const products = await DashboardService.getLowStockProducts(limit);

    res.status(200).json({
      success: true,
      data: products,
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
