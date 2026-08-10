import { Response } from 'express';
import { CustomerService } from '../services/customerService';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { createCustomerSchema, updateCustomerSchema, paginationSchema } from '../validators';

export const createCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = createCustomerSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    // Check if customer email already exists
    const existingCustomer = await CustomerService.getCustomerByEmail(value.email);
    if (existingCustomer) {
      throw new AppError('Customer with this email already exists', 409);
    }

    const customer = await CustomerService.createCustomer(value);

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer,
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

export const getAllCustomers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { error, value } = paginationSchema.validate(req.query);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const result = await CustomerService.getAllCustomers(value);

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

export const getCustomerById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const customerId = parseInt(id);

    if (isNaN(customerId)) {
      throw new AppError('Invalid customer ID', 400);
    }

    const customer = await CustomerService.getCustomerById(customerId);
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    res.status(200).json({
      success: true,
      data: customer,
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

export const updateCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const customerId = parseInt(id);

    if (isNaN(customerId)) {
      throw new AppError('Invalid customer ID', 400);
    }

    const { error, value } = updateCustomerSchema.validate(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    // Check if email is being updated and if it already exists
    if (value.email) {
      const existingCustomer = await CustomerService.getCustomerByEmail(value.email);
      if (existingCustomer && existingCustomer.id !== customerId) {
        throw new AppError('Customer with this email already exists', 409);
      }
    }

    const customer = await CustomerService.updateCustomer(customerId, value);
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Customer updated successfully',
      data: customer,
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

export const deleteCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const customerId = parseInt(id);

    if (isNaN(customerId)) {
      throw new AppError('Invalid customer ID', 400);
    }

    const deleted = await CustomerService.deleteCustomer(customerId);
    if (!deleted) {
      throw new AppError('Customer not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Customer deleted successfully',
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

export const deactivateCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const customerId = parseInt(id);

    if (isNaN(customerId)) {
      throw new AppError('Invalid customer ID', 400);
    }

    const customer = await CustomerService.deactivateCustomer(customerId);
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    res.status(200).json({
      success: true,
      message: 'Customer deactivated successfully',
      data: customer,
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
