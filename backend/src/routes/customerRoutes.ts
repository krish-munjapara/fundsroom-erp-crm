import { Router } from 'express';
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  deactivateCustomer,
} from '../controllers/customerController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All customer routes require authentication
router.use(authenticate);

// Routes for Sales and Admin
router.post('/', authorize('admin', 'sales'), createCustomer);
router.get('/', getAllCustomers);
router.get('/:id', getCustomerById);
router.put('/:id', authorize('admin', 'sales'), updateCustomer);

// Admin-only routes
router.delete('/:id', authorize('admin'), deleteCustomer);
router.patch('/:id/deactivate', authorize('admin'), deactivateCustomer);

export default router;
