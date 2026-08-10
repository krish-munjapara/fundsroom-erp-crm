import { Router } from 'express';
import healthRoutes from './healthRoutes';

const router = Router();

router.use('/api', healthRoutes);

export default router;
