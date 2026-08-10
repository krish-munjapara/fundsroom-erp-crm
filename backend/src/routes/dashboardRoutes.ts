import { Router } from 'express';
import {
  getDashboardStats,
  getRecentOrders,
  getRecentActivities,
  getOrderStatusSummary,
} from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

// Dashboard endpoints
router.get('/stats', getDashboardStats);
router.get('/recent-orders', getRecentOrders);
router.get('/recent-activities', getRecentActivities);
router.get('/order-status-summary', getOrderStatusSummary);

export default router;
