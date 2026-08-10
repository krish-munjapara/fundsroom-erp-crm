import { Response } from 'express';
import { CustomerActivityService } from '../services/customerActivityService';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import {
  createCustomerActivitySchema,
  updateCustomerActivitySchema,
  paginationSchema,
} from '../validators';

export const createActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = createCustomerActivitySchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const activity = await CustomerActivityService.createActivity({
      ...value,
      created_by: req.user?.id,
    });

    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      data: activity,
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

export const getAllActivities = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = paginationSchema.validate(req.query);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const result = await CustomerActivityService.getAllActivities(value);

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

export const getActivityById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const activityId = parseInt(id);

    if (isNaN(activityId)) {
      throw new AppError('Invalid activity ID', 400);
    }

    const activity = await CustomerActivityService.getActivityById(activityId);
    if (!activity) {
      throw new AppError('Activity not found', 404);
    }

    res.status(200).json({
      success: true,
      data: activity,
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

export const getActivitiesByCustomerId = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;
    const id = parseInt(customerId);

    if (isNaN(id)) {
      throw new AppError('Invalid customer ID', 400);
    }

    const activities = await CustomerActivityService.getActivitiesByCustomerId(id);

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

export const getActivityTimeline = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;
    const id = parseInt(customerId);

    if (isNaN(id)) {
      throw new AppError('Invalid customer ID', 400);
    }

    const timeline = await CustomerActivityService.getActivityTimeline(id);

    res.status(200).json({
      success: true,
      data: timeline,
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

export const updateActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const activityId = parseInt(id);

    if (isNaN(activityId)) {
      throw new AppError('Invalid activity ID', 400);
    }

    const { error, value } = updateCustomerActivitySchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const activity = await CustomerActivityService.updateActivity({
      ...value,
      id: activityId,
      updated_by: req.user?.id,
    });

    if (!activity) {
      throw new AppError('Activity not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Activity updated successfully',
      data: activity,
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

export const deleteActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const activityId = parseInt(id);

    if (isNaN(activityId)) {
      throw new AppError('Invalid activity ID', 400);
    }

    const deleted = await CustomerActivityService.deleteActivity(activityId);
    if (!deleted) {
      throw new AppError('Activity not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Activity deleted successfully',
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
