import { Router } from 'express';
import {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrderByOrderNumber,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  getOrdersByCustomerId,
  getOrderStats,
} from '../controllers/orderController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All order routes require authentication
router.use(authenticate);

// Routes for authenticated users
router.post('/', createOrder);
router.get('/', getAllOrders);
router.get('/stats', getOrderStats);
router.get('/customer/:customerId', getOrdersByCustomerId);
router.get('/number/:orderNumber', getOrderByOrderNumber);
router.get('/:id', getOrderById);
router.put('/:id', updateOrder);
router.patch('/:id/status', updateOrderStatus);

// Admin-only routes
router.delete('/:id', authorize('admin'), deleteOrder);

export default router;
