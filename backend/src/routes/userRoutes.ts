import { Router } from 'express';
import { getAllUsers, getUserById } from '../controllers/userController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// All user routes are protected and require admin role
router.get('/', authenticate, authorize('admin'), getAllUsers);
router.get('/:id', authenticate, authorize('admin'), getUserById);

export default router;
