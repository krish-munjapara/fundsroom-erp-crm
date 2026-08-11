import { Router } from 'express';
import { register, login, getProfile } from '../controllers/authController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/login', login);

// Admin-only user registration (case study uses seeded users for demo)
router.post('/register', authenticate, authorize('admin'), register);

// Protected routes
router.get('/profile', authenticate, getProfile);

export default router;
