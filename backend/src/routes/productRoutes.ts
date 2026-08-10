import { Router } from 'express';
import {
  createProduct,
  getAllProducts,
  getActiveProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from '../controllers/productController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All product routes require authentication
router.use(authenticate);

// Routes for authenticated users
router.post('/', createProduct);
router.get('/', getAllProducts);
router.get('/active', getActiveProducts);
router.get('/:id', getProductById);
router.put('/:id', updateProduct);

// Admin-only routes
router.delete('/:id', authorize('admin'), deleteProduct);

export default router;
