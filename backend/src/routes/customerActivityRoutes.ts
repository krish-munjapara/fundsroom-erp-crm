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
import { authenticate, authorize } from '../middleware/auth';
import { ACTIVITY_READ_ROLES, ACTIVITY_WRITE_ROLES } from '../middleware/roles';

const router = Router();

router.use(authenticate);

router.get('/', authorize(...ACTIVITY_READ_ROLES), getAllActivities);
router.get('/customer/:customerId', authorize(...ACTIVITY_READ_ROLES), getActivitiesByCustomerId);
router.get('/customer/:customerId/timeline', authorize(...ACTIVITY_READ_ROLES), getActivityTimeline);
router.get('/:id', authorize(...ACTIVITY_READ_ROLES), getActivityById);

router.post('/', authorize(...ACTIVITY_WRITE_ROLES), createActivity);
router.put('/:id', authorize(...ACTIVITY_WRITE_ROLES), updateActivity);
router.delete('/:id', authorize(...ACTIVITY_WRITE_ROLES), deleteActivity);

export default router;
