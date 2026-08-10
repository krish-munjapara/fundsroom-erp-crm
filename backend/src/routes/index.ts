import { Router } from 'express';
import healthRoutes from './healthRoutes';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import customerRoutes from './customerRoutes';
import productRoutes from './productRoutes';
import inventoryRoutes from './inventoryRoutes';
import orderRoutes from './orderRoutes';
import dashboardRoutes from './dashboardRoutes';
import reportingRoutes from './reportingRoutes';
import customerActivityRoutes from './customerActivityRoutes';

const router = Router();

router.use('/api', healthRoutes);
router.use('/api/auth', authRoutes);
router.use('/api/users', userRoutes);
router.use('/api/customers', customerRoutes);
router.use('/api/products', productRoutes);
router.use('/api/inventory', inventoryRoutes);
router.use('/api/orders', orderRoutes);
router.use('/api/dashboard', dashboardRoutes);
router.use('/api/reports', reportingRoutes);
router.use('/api/activities', customerActivityRoutes);

export default router;
