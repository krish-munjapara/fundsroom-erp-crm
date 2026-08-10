import {
  createCustomerActivitySchema,
  updateCustomerActivitySchema,
  reportFiltersSchema,
  dashboardParamsSchema,
} from '../validators/phase4Validator';

describe('Phase 4 Validators', () => {
  describe('createCustomerActivitySchema', () => {
    test('should validate correct activity data', () => {
      const data = {
        customer_id: 1,
        activity_type: 'call',
        subject: 'Follow up call',
        description: 'Check with customer',
        status: 'pending',
        due_date: new Date(),
        assigned_to: 1,
        created_by: 1,
      };

      const { error, value } = createCustomerActivitySchema.validate(data);
      expect(error).toBeUndefined();
      expect(value).toMatchObject(data);
    });

    test('should reject invalid activity type', () => {
      const data = {
        customer_id: 1,
        activity_type: 'invalid_type',
        subject: 'Test',
      };

      const { error } = createCustomerActivitySchema.validate(data);
      expect(error).toBeDefined();
    });

    test('should reject missing required fields', () => {
      const data = {
        customer_id: 1,
      };

      const { error } = createCustomerActivitySchema.validate(data);
      expect(error).toBeDefined();
    });
  });

  describe('updateCustomerActivitySchema', () => {
    test('should validate partial activity update', () => {
      const data = {
        subject: 'Updated subject',
        status: 'completed',
      };

      const { error, value } = updateCustomerActivitySchema.validate(data);
      expect(error).toBeUndefined();
      expect(value).toEqual(data);
    });

    test('should reject invalid status in update', () => {
      const data = {
        status: 'invalid_status',
      };

      const { error } = updateCustomerActivitySchema.validate(data);
      expect(error).toBeDefined();
    });
  });

  describe('reportFiltersSchema', () => {
    test('should validate correct report filters', () => {
      const data = {
        start_date: new Date('2024-01-01'),
        end_date: new Date('2024-12-31'),
        customer_id: 1,
        product_id: 2,
        status: 'delivered',
      };

      const { error, value } = reportFiltersSchema.validate(data);
      expect(error).toBeUndefined();
      expect(value).toEqual(data);
    });

    test('should reject end_date before start_date', () => {
      const data = {
        start_date: new Date('2024-12-31'),
        end_date: new Date('2024-01-01'),
      };

      const { error } = reportFiltersSchema.validate(data);
      expect(error).toBeDefined();
    });
  });

  describe('dashboardParamsSchema', () => {
    test('should validate correct dashboard params', () => {
      const data = {
        limit: 10,
      };

      const { error, value } = dashboardParamsSchema.validate(data);
      expect(error).toBeUndefined();
      expect(value).toEqual({ limit: 10 });
    });

    test('should reject limit above 100', () => {
      const data = {
        limit: 150,
      };

      const { error } = dashboardParamsSchema.validate(data);
      expect(error).toBeDefined();
    });

    test('should reject negative limit', () => {
      const data = {
        limit: -5,
      };

      const { error } = dashboardParamsSchema.validate(data);
      expect(error).toBeDefined();
    });
  });
});
