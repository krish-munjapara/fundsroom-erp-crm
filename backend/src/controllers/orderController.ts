import { Response } from 'express';
import { OrderService } from '../services/orderService';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { createOrderSchema, updateOrderSchema, updateOrderStatusSchema, paginationSchema } from '../validators';

const handleError = (error: unknown, res: Response): void => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
};

export const createOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = createOrderSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const order = await OrderService.createOrder(value, req.user.id);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (error) {
    handleError(error, res);
  }
};

export const getAllOrders = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = paginationSchema.validate(req.query);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const result = await OrderService.getAllOrders(value);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    handleError(error, res);
  }
};

export const getOrderById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      throw new AppError('Invalid order ID', 400);
    }

    const order = await OrderService.getOrderById(orderId);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    handleError(error, res);
  }
};

export const getOrderByOrderNumber = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { orderNumber } = req.params;

    const order = await OrderService.getOrderByOrderNumber(orderNumber);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    handleError(error, res);
  }
};

export const updateOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      throw new AppError('Invalid order ID', 400);
    }

    const { error, value } = updateOrderSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const order = await OrderService.updateOrder(orderId, value, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Order updated successfully',
      data: order,
    });
  } catch (error) {
    handleError(error, res);
  }
};

export const confirmOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      throw new AppError('Invalid order ID', 400);
    }

    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const order = await OrderService.confirmOrder(orderId, req.user.id);

    res.status(200).json({
      success: true,
      message: 'Order confirmed successfully',
      data: order,
    });
  } catch (error) {
    handleError(error, res);
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      throw new AppError('Invalid order ID', 400);
    }

    const { error, value } = updateOrderStatusSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    const order = await OrderService.updateOrderStatus(orderId, value.status, req.user.id);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: order,
    });
  } catch (error) {
    handleError(error, res);
  }
};

export const deleteOrder = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const orderId = parseInt(id);

    if (isNaN(orderId)) {
      throw new AppError('Invalid order ID', 400);
    }

    const deleted = await OrderService.deleteOrder(orderId);
    if (!deleted) {
      throw new AppError('Order not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Order deleted successfully',
    });
  } catch (error) {
    handleError(error, res);
  }
};

export const getOrdersByCustomerId = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { customerId } = req.params;
    const id = parseInt(customerId);

    if (isNaN(id)) {
      throw new AppError('Invalid customer ID', 400);
    }

    const orders = await OrderService.getOrdersByCustomerId(id);

    res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    handleError(error, res);
  }
};

export const getOrderStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const stats = await OrderService.getOrderStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    handleError(error, res);
  }
};
