import { Router } from 'express';
import {
  createChallan,
  getAllChallans,
  getChallanById,
  updateChallan,
  confirmChallan,
  cancelChallan,
  deleteChallan,
} from '../controllers/challanController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All challan routes require authentication
router.use(authenticate);

// Routes for Sales and Admin
router.post('/', authorize('admin', 'sales'), createChallan);
router.get('/', getAllChallans);
router.get('/:id', getChallanById);
router.put('/:id', authorize('admin', 'sales'), updateChallan);
router.post('/:id/confirm', authorize('admin', 'sales'), confirmChallan);
router.post('/:id/cancel', authorize('admin', 'sales'), cancelChallan);

// Admin-only routes
router.delete('/:id', authorize('admin'), deleteChallan);

export default router;
