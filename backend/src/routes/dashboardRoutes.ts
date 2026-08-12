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
import { authenticate, authorize } from '../middleware/auth';
import { DASHBOARD_ROLES } from '../middleware/roles';

const router = Router();

router.use(authenticate);
router.use(authorize(...DASHBOARD_ROLES));

router.get('/stats', getDashboardStats);
router.get('/recent-orders', getRecentOrders);
router.get('/recent-activities', getRecentActivities);
router.get('/order-status-summary', getOrderStatusSummary);
router.get('/sales-trend', getSalesTrend);
router.get('/top-products', getTopProducts);
router.get('/low-stock-products', getLowStockProducts);

export default router;
