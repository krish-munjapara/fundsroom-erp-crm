import { Response } from 'express';
import { ReportingService } from '../services/reportingService';
import { InventoryReportingService } from '../services/inventoryReportingService';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { reportFiltersSchema } from '../validators';

export const getSalesReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = reportFiltersSchema.validate(req.query);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const report = await ReportingService.getSalesReport(value);

    res.status(200).json({
      success: true,
      data: report,
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

export const getCustomerReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = reportFiltersSchema.validate(req.query);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const report = await ReportingService.getCustomerReport(value);

    res.status(200).json({
      success: true,
      data: report,
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

export const getProductPerformanceReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = reportFiltersSchema.validate(req.query);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const report = await ReportingService.getProductPerformanceReport(value);

    res.status(200).json({
      success: true,
      data: report,
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

export const getInventoryReport = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = reportFiltersSchema.validate(req.query);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const report = await ReportingService.getInventoryReport(value);

    res.status(200).json({
      success: true,
      data: report,
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

export const getStockMovementSummary = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { product_id } = req.query;
    const summary = await InventoryReportingService.getStockMovementSummary(
      product_id ? parseInt(product_id as string) : undefined
    );

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

export const getProductStockStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const status = await InventoryReportingService.getProductStockStatus();

    res.status(200).json({
      success: true,
      data: status,
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
