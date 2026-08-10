import { CustomerActivityService } from '../services/customerActivityService';
import { pool } from '../config/database';

jest.mock('../config/database');

describe('CustomerActivityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createActivity', () => {
    test('should create an activity successfully', async () => {
      const mockActivity = {
        id: 1,
        customer_id: 1,
        activity_type: 'call',
        subject: 'Follow up',
        description: 'Check in with customer',
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (pool.query as jest.Mock).mockResolvedValue({
        rows: [mockActivity],
      });

      const result = await CustomerActivityService.createActivity({
        customer_id: 1,
        activity_type: 'call',
        subject: 'Follow up',
        created_by: 1,
      });

      expect(result).toEqual(mockActivity);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO customer_activities'),
        expect.any(Array)
      );
    });
  });

  describe('getAllActivities', () => {
    test('should return paginated activities', async () => {
      const mockActivities = [
        { id: 1, subject: 'Activity 1', customer_name: 'Company A' },
        { id: 2, subject: 'Activity 2', customer_name: 'Company B' },
      ];

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({ rows: mockActivities });

      const result = await CustomerActivityService.getAllActivities({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockActivities);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        pages: 1,
      });
    });
  });

  describe('getActivityById', () => {
    test('should return activity by ID', async () => {
      const mockActivity = {
        id: 1,
        subject: 'Test Activity',
        customer_name: 'Company A',
      };

      (pool.query as jest.Mock).mockResolvedValue({
        rows: [mockActivity],
      });

      const result = await CustomerActivityService.getActivityById(1);

      expect(result).toEqual(mockActivity);
    });

    test('should return null when activity not found', async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [],
      });

      const result = await CustomerActivityService.getActivityById(999);

      expect(result).toBeNull();
    });
  });

  describe('getActivitiesByCustomerId', () => {
    test('should return activities for a customer', async () => {
      const mockActivities = [
        { id: 1, subject: 'Activity 1' },
        { id: 2, subject: 'Activity 2' },
      ];

      (pool.query as jest.Mock).mockResolvedValue({
        rows: mockActivities,
      });

      const result = await CustomerActivityService.getActivitiesByCustomerId(1);

      expect(result).toEqual(mockActivities);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE ca.customer_id = $1'),
        [1]
      );
    });
  });

  describe('updateActivity', () => {
    test('should update activity successfully', async () => {
      const mockUpdatedActivity = {
        id: 1,
        subject: 'Updated Subject',
        status: 'completed',
      };

      (pool.query as jest.Mock).mockResolvedValue({
        rows: [mockUpdatedActivity],
      });

      const result = await CustomerActivityService.updateActivity({
        id: 1,
        subject: 'Updated Subject',
        status: 'completed',
      });

      expect(result).toEqual(mockUpdatedActivity);
    });
  });

  describe('deleteActivity', () => {
    test('should delete activity successfully', async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rowCount: 1,
      });

      const result = await CustomerActivityService.deleteActivity(1);

      expect(result).toBe(true);
    });
  });
});
