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

// Routes for authenticated users (specific routes first to avoid conflicts)
router.post('/', createInventory);
router.get('/low-stock', getLowStockProducts);
router.get('/movements', getStockMovements);
router.post('/movements', recordStockMovement);
router.get('/product/:productId', getInventoryByProductId);
router.patch('/product/:productId/quantity', updateStockQuantity);
router.get('/', getAllInventory);
router.put('/:id', updateInventory);

// Admin-only routes
router.delete('/:id', authorize('admin'), deleteInventory);

export default router;
