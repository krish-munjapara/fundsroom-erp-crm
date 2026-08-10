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

// Routes for authenticated users
router.post('/', createCustomer);
router.get('/', getAllCustomers);
router.get('/:id', getCustomerById);
router.put('/:id', updateCustomer);

// Admin-only routes
router.delete('/:id', authorize('admin'), deleteCustomer);
router.patch('/:id/deactivate', authorize('admin'), deactivateCustomer);

export default router;
