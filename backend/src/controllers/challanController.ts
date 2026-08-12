import { Response } from 'express';
import { ChallanService } from '../services/challanService';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { createChallanSchema, updateChallanSchema, challanPaginationSchema } from '../validators';

export const createChallan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = createChallanSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const challan = await ChallanService.createChallan(value, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Challan created successfully',
      data: challan,
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
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }
};

export const getAllChallans = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = challanPaginationSchema.validate(req.query);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const result = await ChallanService.getAllChallans(value);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
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

export const getChallanById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const challanId = parseInt(id);

    if (isNaN(challanId)) {
      throw new AppError('Invalid challan ID', 400);
    }

    const challan = await ChallanService.getChallanById(challanId);
    if (!challan) {
      throw new AppError('Challan not found', 404);
    }

    res.status(200).json({
      success: true,
      data: challan,
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

export const updateChallan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const challanId = parseInt(id);

    if (isNaN(challanId)) {
      throw new AppError('Invalid challan ID', 400);
    }

    const { error, value } = updateChallanSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const challan = await ChallanService.updateChallan(challanId, value);

    res.status(200).json({
      success: true,
      message: 'Challan updated successfully',
      data: challan,
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
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }
};

export const confirmChallan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const challanId = parseInt(id);

    if (isNaN(challanId)) {
      throw new AppError('Invalid challan ID', 400);
    }

    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const challan = await ChallanService.confirmChallan(challanId, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Challan confirmed successfully',
      data: challan,
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
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }
};

export const cancelChallan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const challanId = parseInt(id);

    if (isNaN(challanId)) {
      throw new AppError('Invalid challan ID', 400);
    }

    const challan = await ChallanService.cancelChallan(challanId);

    res.status(200).json({
      success: true,
      message: 'Challan cancelled successfully',
      data: challan,
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
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }
};

export const deleteChallan = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const challanId = parseInt(id);

    if (isNaN(challanId)) {
      throw new AppError('Invalid challan ID', 400);
    }

    const deleted = await ChallanService.deleteChallan(challanId);
    if (!deleted) {
      throw new AppError('Challan not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Challan deleted successfully',
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
        message: error instanceof Error ? error.message : 'Internal server error',
      });
    }
  }
};
