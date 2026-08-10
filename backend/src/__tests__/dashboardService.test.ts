import { DashboardService } from '../services/dashboardService';
import { pool } from '../config/database';

jest.mock('../config/database');

describe('DashboardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    test('should return dashboard statistics', async () => {
      const mockStats = {
        total_customers: 25,
        total_products: 50,
        total_orders: 100,
        total_sales: 50000,
        low_stock_count: 5,
        pending_orders: 10,
        confirmed_orders: 20,
        delivered_orders: 65,
        cancelled_orders: 5,
      };

      (pool.query as jest.Mock).mockResolvedValue({
        rows: [mockStats],
      });

      const result = await DashboardService.getDashboardStats();

      expect(result).toEqual(mockStats);
      expect(pool.query).toHaveBeenCalled();
    });
  });

  describe('getRecentOrders', () => {
    test('should return recent orders', async () => {
      const mockOrders = [
        { id: 1, order_number: 'ORD-001', customer_name: 'Company A', total_amount: 1000, status: 'delivered', order_date: new Date() },
        { id: 2, order_number: 'ORD-002', customer_name: 'Company B', total_amount: 2000, status: 'pending', order_date: new Date() },
      ];

      (pool.query as jest.Mock).mockResolvedValue({
        rows: mockOrders,
      });

      const result = await DashboardService.getRecentOrders(5);

      expect(result).toEqual(mockOrders);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT'),
        [5]
      );
    });
  });

  describe('getRecentActivities', () => {
    test('should return recent activities', async () => {
      const mockActivities = [
        { id: 1, customer_name: 'Company A', activity_type: 'call', subject: 'Follow up', status: 'pending', created_at: new Date() },
      ];

      (pool.query as jest.Mock).mockResolvedValue({
        rows: mockActivities,
      });

      const result = await DashboardService.getRecentActivities(5);

      expect(result).toEqual(mockActivities);
      expect(pool.query).toHaveBeenCalled();
    });
  });

  describe('getOrderStatusSummary', () => {
    test('should return order status summary', async () => {
      const mockSummary = [
        { status: 'pending', count: '10' },
        { status: 'delivered', count: '65' },
      ];

      (pool.query as jest.Mock).mockResolvedValue({
        rows: mockSummary,
      });

      const result = await DashboardService.getOrderStatusSummary();

      expect(result).toEqual({
        pending: 10,
        delivered: 65,
      });
    });
  });
});
