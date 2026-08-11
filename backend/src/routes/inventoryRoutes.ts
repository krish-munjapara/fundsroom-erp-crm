import { Router } from 'express';
import {
  createInventory,
  getAllInventory,
  getInventoryByProductId,
  updateInventory,
  updateStockQuantity,
  recordStockMovement,
  getLowStockProducts,
  getStockMovements,
  deleteInventory,
} from '../controllers/inventoryController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All inventory routes require authentication
router.use(authenticate);

// Routes for Warehouse and Admin
router.post('/', authorize('admin', 'warehouse'), createInventory);
router.get('/low-stock', getLowStockProducts);
router.get('/movements', getStockMovements);
router.post('/movements', authorize('admin', 'warehouse'), recordStockMovement);
router.get('/product/:productId', getInventoryByProductId);
router.patch('/product/:productId/quantity', authorize('admin', 'warehouse'), updateStockQuantity);
router.get('/', getAllInventory);
router.put('/:id', authorize('admin', 'warehouse'), updateInventory);

// Admin-only routes
router.delete('/:id', authorize('admin'), deleteInventory);

export default router;
