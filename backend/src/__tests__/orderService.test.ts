import { OrderService } from '../services/orderService';
import { pool } from '../config/database';

jest.mock('../config/database');

describe('OrderService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('getAllOrders', () => {
    test('should return paginated orders', async () => {
      const mockOrders = [
        { id: 1, order_number: 'ORD-001', customer_name: 'Company A' },
        { id: 2, order_number: 'ORD-002', customer_name: 'Company B' },
      ];

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({ rows: mockOrders });

      const result = await OrderService.getAllOrders({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockOrders);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        pages: 1,
      });
    });
  });

  describe('getOrderById', () => {
    test('should return order with items', async () => {
      const mockItems = [
        {
          id: 1,
          product_id: 1,
          quantity: 10,
          unit_price: 150,
          subtotal: 1500,
          total_amount: 1770,
          product_name: 'Widget A',
        },
      ];

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            order_number: 'ORD-001',
            customer_name: 'Company A',
            total_amount: 1770,
          }],
        })
        .mockResolvedValueOnce({ rows: mockItems });

      const result = await OrderService.getOrderById(1);

      expect(result?.order_number).toBe('ORD-001');
      expect(result?.items).toHaveLength(1);
      expect(result?.total_items).toBe(1);
      expect(result?.total_quantity).toBe(10);
    });

    test('should return null when order not found', async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [],
      });

      const result = await OrderService.getOrderById(999);

      expect(result).toBeNull();
    });
  });

  describe('updateOrderStatus', () => {
    test('should update non-confirmed status successfully', async () => {
      const pendingOrder = {
        id: 1,
        status: 'pending',
        created_by: 1,
        customer_id: 1,
      };

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [pendingOrder] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ id: 1, status: 'processing' }] });

      const result = await OrderService.updateOrderStatus(1, 'processing', 1);

      expect(result).toEqual({ id: 1, status: 'processing' });
    });
  });

  describe('getOrderStats', () => {
    test('should return order statistics', async () => {
      const mockStats = {
        total_orders: '25',
        pending_orders: '5',
        confirmed_orders: '10',
        delivered_orders: '8',
        total_revenue: '42500',
      };

      (pool.query as jest.Mock).mockResolvedValue({
        rows: [mockStats],
      });

      const result = await OrderService.getOrderStats();

      expect(result).toEqual(mockStats);
      expect(pool.query).toHaveBeenCalled();
    });
  });

  describe('deleteOrder', () => {
    test('should delete pending order successfully', async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({
          rows: [{
            id: 1,
            status: 'pending',
            customer_id: 1,
          }],
        })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rowCount: 1 });

      const result = await OrderService.deleteOrder(1);

      expect(result).toBe(true);
    });
  });
});
