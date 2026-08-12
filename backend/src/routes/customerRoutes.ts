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
import { CUSTOMER_READ_ROLES, CUSTOMER_WRITE_ROLES } from '../middleware/roles';

const router = Router();

router.use(authenticate);

router.post('/', authorize(...CUSTOMER_WRITE_ROLES), createCustomer);
router.get('/', authorize(...CUSTOMER_READ_ROLES), getAllCustomers);
router.get('/:id', authorize(...CUSTOMER_READ_ROLES), getCustomerById);
router.put('/:id', authorize(...CUSTOMER_WRITE_ROLES), updateCustomer);

// Admin-only routes
router.delete('/:id', authorize('admin'), deleteCustomer);
router.patch('/:id/deactivate', authorize('admin'), deactivateCustomer);

export default router;
