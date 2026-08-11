import Joi from 'joi';

// Customer Validators
export const createCustomerSchema = Joi.object({
  company_name: Joi.string().min(2).max(255).required().messages({
    'string.min': 'Company name must be at least 2 characters',
    'string.max': 'Company name must not exceed 255 characters',
    'any.required': 'Company name is required',
  }),
  contact_person: Joi.string().min(2).max(255).required().messages({
    'string.min': 'Contact person must be at least 2 characters',
    'string.max': 'Contact person must not exceed 255 characters',
    'any.required': 'Contact person is required',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  phone: Joi.string().pattern(/^[0-9+\-\s()]{10,20}$/).optional().messages({
    'string.pattern.base': 'Please provide a valid phone number',
  }),
  address: Joi.string().max(500).optional(),
  city: Joi.string().max(100).optional(),
  state: Joi.string().max(100).optional(),
  postal_code: Joi.string().max(20).optional(),
  country: Joi.string().max(100).optional(),
  tax_id: Joi.string().max(50).optional(),
  credit_limit: Joi.number().min(0).optional().messages({
    'number.min': 'Credit limit must be non-negative',
  }),
  notes: Joi.string().max(1000).optional(),
});

export const updateCustomerSchema = Joi.object({
  company_name: Joi.string().min(2).max(255).optional(),
  contact_person: Joi.string().min(2).max(255).optional(),
  email: Joi.string().email().optional(),
  phone: Joi.string().pattern(/^[0-9+\-\s()]{10,20}$/).optional(),
  address: Joi.string().max(500).optional(),
  city: Joi.string().max(100).optional(),
  state: Joi.string().max(100).optional(),
  postal_code: Joi.string().max(20).optional(),
  country: Joi.string().max(100).optional(),
  tax_id: Joi.string().max(50).optional(),
  credit_limit: Joi.number().min(0).optional(),
  current_balance: Joi.number().min(0).optional(),
  is_active: Joi.boolean().optional(),
  notes: Joi.string().max(1000).optional(),
});

// Product Validators
export const createProductSchema = Joi.object({
  sku: Joi.string().min(3).max(50).required().messages({
    'string.min': 'SKU must be at least 3 characters',
    'string.max': 'SKU must not exceed 50 characters',
    'any.required': 'SKU is required',
  }),
  name: Joi.string().min(2).max(255).required().messages({
    'string.min': 'Product name must be at least 2 characters',
    'string.max': 'Product name must not exceed 255 characters',
    'any.required': 'Product name is required',
  }),
  description: Joi.string().max(1000).optional(),
  category: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Category must be at least 2 characters',
    'string.max': 'Category must not exceed 100 characters',
    'any.required': 'Category is required',
  }),
  unit_price: Joi.number().min(0).required().messages({
    'number.min': 'Unit price must be non-negative',
    'any.required': 'Unit price is required',
  }),
  current_stock: Joi.number().integer().min(0).required().messages({
    'number.min': 'Current stock must be non-negative',
    'any.required': 'Current stock is required',
  }),
  minimum_stock: Joi.number().integer().min(0).required().messages({
    'number.min': 'Minimum stock must be non-negative',
    'any.required': 'Minimum stock is required',
  }),
  location: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Location must be at least 2 characters',
    'string.max': 'Location must not exceed 100 characters',
    'any.required': 'Location is required',
  }),
  warehouse: Joi.string().max(100).optional(),
  is_active: Joi.boolean().optional(),
});

export const updateProductSchema = Joi.object({
  sku: Joi.string().min(3).max(50).optional(),
  name: Joi.string().min(2).max(255).optional(),
  description: Joi.string().max(1000).optional(),
  category: Joi.string().min(2).max(100).optional(),
  unit_price: Joi.number().min(0).optional(),
  minimum_stock: Joi.number().integer().min(0).optional(),
  location: Joi.string().min(2).max(100).optional(),
  warehouse: Joi.string().max(100).optional(),
  is_active: Joi.boolean().optional(),
});

// Inventory Validators
export const createInventorySchema = Joi.object({
  product_id: Joi.number().integer().positive().required().messages({
    'number.integer': 'Product ID must be an integer',
    'number.positive': 'Product ID must be positive',
    'any.required': 'Product ID is required',
  }),
  quantity: Joi.number().integer().min(0).optional().messages({
    'number.min': 'Quantity must be non-negative',
  }),
  location: Joi.string().max(100).optional(),
  warehouse: Joi.string().max(100).optional(),
});

export const updateInventorySchema = Joi.object({
  quantity: Joi.number().integer().min(0).optional(),
  reserved_quantity: Joi.number().integer().min(0).optional(),
  location: Joi.string().max(100).optional(),
  warehouse: Joi.string().max(100).optional(),
});

export const stockMovementSchema = Joi.object({
  product_id: Joi.number().integer().positive().required().messages({
    'number.integer': 'Product ID must be an integer',
    'number.positive': 'Product ID must be positive',
    'any.required': 'Product ID is required',
  }),
  quantity: Joi.number().integer().positive().required().messages({
    'any.required': 'Quantity is required',
    'number.positive': 'Quantity must be positive',
  }),
  movement_type: Joi.string().valid('in', 'out').required().messages({
    'any.only': 'Movement type must be one of: in, out',
    'any.required': 'Movement type is required',
  }),
  reference_type: Joi.string().max(50).optional(),
  reference_id: Joi.number().integer().optional(),
  notes: Joi.string().min(2).max(500).required().messages({
    'string.min': 'Reason must be at least 2 characters',
    'string.max': 'Reason must not exceed 500 characters',
    'any.required': 'Reason is required',
  }),
});

// Order Validators
export const createOrderSchema = Joi.object({
  customer_id: Joi.number().integer().positive().required().messages({
    'number.integer': 'Customer ID must be an integer',
    'number.positive': 'Customer ID must be positive',
    'any.required': 'Customer ID is required',
  }),
  order_date: Joi.date().optional(),
  delivery_date: Joi.date().optional(),
  status: Joi.string().valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled').optional(),
  notes: Joi.string().max(1000).optional(),
  items: Joi.array().items(
    Joi.object({
      product_id: Joi.number().integer().positive().required().messages({
        'number.integer': 'Product ID must be an integer',
        'number.positive': 'Product ID must be positive',
        'any.required': 'Product ID is required',
      }),
      quantity: Joi.number().integer().positive().required().messages({
        'number.integer': 'Quantity must be an integer',
        'number.positive': 'Quantity must be positive',
        'any.required': 'Quantity is required',
      }),
      unit_price: Joi.number().min(0).required().messages({
        'number.min': 'Unit price must be non-negative',
        'any.required': 'Unit price is required',
      }),
      tax_rate: Joi.number().min(0).max(100).optional(),
      item_discount_amount: Joi.number().min(0).optional(),
    })
  ).min(1).required().messages({
    'array.min': 'Order must have at least one item',
    'any.required': 'Order items are required',
  }),
});

export const updateOrderSchema = Joi.object({
  customer_id: Joi.number().integer().positive().optional(),
  order_date: Joi.date().optional(),
  delivery_date: Joi.date().optional(),
  status: Joi.string().valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled').optional(),
  subtotal: Joi.number().min(0).optional(),
  tax_amount: Joi.number().min(0).optional(),
  discount_amount: Joi.number().min(0).optional(),
  total_amount: Joi.number().min(0).optional(),
  notes: Joi.string().max(1000).optional(),
});

export const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled').required().messages({
    'any.only': 'Status must be one of: pending, confirmed, processing, shipped, delivered, cancelled',
    'any.required': 'Status is required',
  }),
});

// Pagination Validators
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  search: Joi.string().max(100).optional(),
  sort: Joi.string().optional(),
  order: Joi.string().valid('asc', 'desc').optional(),
});
