import { Router } from 'express';
import {
  getDashboardStats,
  getRecentOrders,
  getRecentActivities,
  getOrderStatusSummary,
  getSalesTrend,
  getTopProducts,
  getLowStockProducts,
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
router.get('/sales-trend', getSalesTrend);
router.get('/top-products', getTopProducts);
router.get('/low-stock-products', getLowStockProducts);

export default router;
