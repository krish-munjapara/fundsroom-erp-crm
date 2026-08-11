import { Router } from 'express';
import {
  createProduct,
  getAllProducts,
  getActiveProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  adjustStock,
} from '../controllers/productController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All product routes require authentication
router.use(authenticate);

// Routes for Warehouse and Admin
router.post('/', authorize('admin', 'warehouse'), createProduct);
router.get('/', getAllProducts);
router.get('/active', getActiveProducts);
router.get('/:id', getProductById);
router.put('/:id', authorize('admin', 'warehouse'), updateProduct);
router.patch('/:id/adjust-stock', authorize('admin', 'warehouse'), adjustStock);

// Admin-only routes
router.delete('/:id', authorize('admin'), deleteProduct);

export default router;
