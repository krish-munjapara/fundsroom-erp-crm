import { Router } from 'express';
import {
  getSalesReport,
  getCustomerReport,
  getProductPerformanceReport,
  getInventoryReport,
  getStockMovementSummary,
  getProductStockStatus,
} from '../controllers/reportingController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All reporting routes require authentication
router.use(authenticate);

// Report endpoints
router.get('/sales', getSalesReport);
router.get('/customers', getCustomerReport);
router.get('/products', getProductPerformanceReport);
router.get('/inventory', getInventoryReport);
router.get('/stock-movements', getStockMovementSummary);
router.get('/stock-status', getProductStockStatus);

export default router;
