import { Router } from 'express';
import {
  getSalesReport,
  getCustomerReport,
  getProductPerformanceReport,
  getInventoryReport,
  getStockMovementSummary,
  getProductStockStatus,
} from '../controllers/reportingController';
import { authenticate, authorize } from '../middleware/auth';
import { INVENTORY_REPORT_ROLES, SALES_REPORT_ROLES } from '../middleware/roles';

const router = Router();

router.use(authenticate);

router.get('/sales', authorize(...SALES_REPORT_ROLES), getSalesReport);
router.get('/customers', authorize(...SALES_REPORT_ROLES), getCustomerReport);
router.get('/products', authorize(...SALES_REPORT_ROLES), getProductPerformanceReport);
router.get('/inventory', authorize(...INVENTORY_REPORT_ROLES), getInventoryReport);
router.get('/stock-movements', authorize(...INVENTORY_REPORT_ROLES), getStockMovementSummary);
router.get('/stock-status', authorize(...INVENTORY_REPORT_ROLES), getProductStockStatus);

export default router;
