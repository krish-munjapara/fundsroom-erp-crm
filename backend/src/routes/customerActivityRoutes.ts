import { Router } from 'express';
import {
  createActivity,
  getAllActivities,
  getActivityById,
  getActivitiesByCustomerId,
  getActivityTimeline,
  updateActivity,
  deleteActivity,
} from '../controllers/customerActivityController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All customer activity routes require authentication
router.use(authenticate);

// Activity routes
router.post('/', createActivity);
router.get('/', getAllActivities);
router.get('/customer/:customerId', getActivitiesByCustomerId);
router.get('/customer/:customerId/timeline', getActivityTimeline);
router.get('/:id', getActivityById);
router.put('/:id', updateActivity);
router.delete('/:id', deleteActivity);

export default router;
