import Joi from 'joi';

// Customer Activity Validators
export const createCustomerActivitySchema = Joi.object({
  customer_id: Joi.number().integer().positive().required(),
  activity_type: Joi.string().valid('call', 'email', 'meeting', 'visit', 'note', 'task', 'reminder', 'other').required(),
  subject: Joi.string().min(1).max(255).required(),
  description: Joi.string().allow('', null),
  status: Joi.string().valid('pending', 'in_progress', 'completed', 'cancelled').default('pending'),
  due_date: Joi.date().allow(null),
  assigned_to: Joi.number().integer().positive().allow(null),
  created_by: Joi.number().integer().positive().allow(null),
});

export const updateCustomerActivitySchema = Joi.object({
  id: Joi.number().integer().positive(),
  activity_type: Joi.string().valid('call', 'email', 'meeting', 'visit', 'note', 'task', 'reminder', 'other'),
  subject: Joi.string().min(1).max(255),
  description: Joi.string().allow('', null),
  status: Joi.string().valid('pending', 'in_progress', 'completed', 'cancelled'),
  due_date: Joi.date().allow(null),
  completed_at: Joi.date().allow(null),
  assigned_to: Joi.number().integer().positive().allow(null),
  updated_by: Joi.number().integer().positive().allow(null),
});

// Report Filter Validators
export const reportFiltersSchema = Joi.object({
  start_date: Joi.date().iso(),
  end_date: Joi.date().iso().min(Joi.ref('start_date')),
  customer_id: Joi.number().integer().positive(),
  product_id: Joi.number().integer().positive(),
  status: Joi.string(),
  activity_type: Joi.string(),
});

// Dashboard Parameter Validators
export const dashboardParamsSchema = Joi.object({
  limit: Joi.number().integer().min(1).max(100).default(10),
});
