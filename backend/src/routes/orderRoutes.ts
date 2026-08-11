import { Router } from 'express';
import {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrderByOrderNumber,
  updateOrder,
  confirmOrder,
  updateOrderStatus,
  deleteOrder,
  getOrdersByCustomerId,
  getOrderStats,
} from '../controllers/orderController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All order routes require authentication
router.use(authenticate);

// Routes for Sales, Accounts, and Admin
router.post('/', authorize('admin', 'sales'), createOrder);
router.get('/', getAllOrders);
router.get('/stats', getOrderStats);
router.get('/customer/:customerId', getOrdersByCustomerId);
router.get('/number/:orderNumber', getOrderByOrderNumber);
router.get('/:id', getOrderById);
router.put('/:id', authorize('admin', 'sales'), updateOrder);
router.post('/:id/confirm', authorize('admin', 'sales'), confirmOrder);
router.patch('/:id/status', authorize('admin', 'sales'), updateOrderStatus);

// Admin-only routes
router.delete('/:id', authorize('admin'), deleteOrder);

export default router;
