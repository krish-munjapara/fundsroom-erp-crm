import { Response } from 'express';
import { InventoryService } from '../services/inventoryService';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { createInventorySchema, updateInventorySchema, stockMovementSchema } from '../validators';

export const createInventory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = createInventorySchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const inventory = await InventoryService.createInventory(value);

    res.status(201).json({
      success: true,
      message: 'Inventory record created successfully',
      data: inventory,
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

export const getAllInventory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const inventory = await InventoryService.getAllInventory();

    res.status(200).json({
      success: true,
      data: inventory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const getInventoryByProductId = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const id = parseInt(productId);

    if (isNaN(id)) {
      throw new AppError('Invalid product ID', 400);
    }

    const inventory = await InventoryService.getInventoryByProductId(id);
    if (!inventory) {
      throw new AppError('Inventory record not found', 404);
    }

    res.status(200).json({
      success: true,
      data: inventory,
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

export const updateInventory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const inventoryId = parseInt(id);

    if (isNaN(inventoryId)) {
      throw new AppError('Invalid inventory ID', 400);
    }

    const { error, value } = updateInventorySchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const inventory = await InventoryService.updateInventory(inventoryId, value);
    if (!inventory) {
      throw new AppError('Inventory record not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Inventory updated successfully',
      data: inventory,
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

export const updateStockQuantity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    const id = parseInt(productId);
    if (isNaN(id)) {
      throw new AppError('Invalid product ID', 400);
    }

    if (typeof quantity !== 'number' || isNaN(quantity)) {
      throw new AppError('Invalid quantity', 400);
    }

    const inventory = await InventoryService.updateStockQuantity(id, quantity);
    if (!inventory) {
      throw new AppError('Inventory record not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Stock quantity updated successfully',
      data: inventory,
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

export const recordStockMovement = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = stockMovementSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    await InventoryService.recordStockMovement(value, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Stock movement recorded successfully',
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
    const { threshold } = req.query;
    const thresholdValue = threshold ? parseInt(threshold as string) : 10;

    if (isNaN(thresholdValue)) {
      throw new AppError('Invalid threshold value', 400);
    }

    const products = await InventoryService.getLowStockProducts(thresholdValue);

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

export const getStockMovements = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { productId, limit } = req.query;
    
    const productIdValue = productId ? parseInt(productId as string) : undefined;
    const limitValue = limit ? parseInt(limit as string) : 50;

    if (productId && productIdValue !== undefined && isNaN(productIdValue)) {
      throw new AppError('Invalid product ID', 400);
    }

    if (isNaN(limitValue)) {
      throw new AppError('Invalid limit value', 400);
    }

    const movements = await InventoryService.getStockMovements(productIdValue, limitValue);

    res.status(200).json({
      success: true,
      data: movements,
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

export const deleteInventory = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const inventoryId = parseInt(id);

    if (isNaN(inventoryId)) {
      throw new AppError('Invalid inventory ID', 400);
    }

    const deleted = await InventoryService.deleteInventory(inventoryId);
    if (!deleted) {
      throw new AppError('Inventory record not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Inventory record deleted successfully',
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
