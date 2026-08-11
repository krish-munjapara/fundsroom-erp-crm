import { InventoryReportingService } from '../services/inventoryReportingService';

// Mock the database pool
jest.mock('../config/database', () => ({
  pool: {
    query: jest.fn(),
  },
}));

describe('InventoryReportingService', () => {
  const mockPool = require('../config/database').pool;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStockMovementSummary', () => {
    it('should return stock movement summary without product filter', async () => {
      const mockStatsResult = {
        rows: [{ total_movements: '100', stock_in: '500', stock_out: '300' }],
      };
      const mockTypeResult = {
        rows: [
          { movement_type: 'in', total_quantity: '500' },
          { movement_type: 'out', total_quantity: '300' },
          { movement_type: 'adjustment', total_quantity: '50' },
        ],
      };
      const mockRecentResult = {
        rows: [
          {
            id: 1,
            product_name: 'Widget A',
            sku: 'PROD-001',
            movement_type: 'in',
            quantity: '50',
            created_at: new Date('2024-01-01'),
          },
        ],
      };
      mockPool.query
        .mockResolvedValueOnce(mockStatsResult)
        .mockResolvedValueOnce(mockTypeResult)
        .mockResolvedValueOnce(mockRecentResult);

      const result = await InventoryReportingService.getStockMovementSummary();

      expect(result).toEqual({
        total_movements: 100,
        stock_in: 500,
        stock_out: 300,
        movements_by_type: { in: 500, out: 300, adjustment: 50 },
        recent_movements: [
          {
            id: 1,
            product_name: 'Widget A',
            sku: 'PROD-001',
            movement_type: 'in',
            quantity: 50,
            created_at: new Date('2024-01-01'),
          },
        ],
      });
      expect(mockPool.query).toHaveBeenCalledTimes(3);
    });

    it('should return stock movement summary with product filter', async () => {
      const mockStatsResult = {
        rows: [{ total_movements: '20', stock_in: '100', stock_out: '50' }],
      };
      const mockTypeResult = {
        rows: [{ movement_type: 'in', total_quantity: '100' }, { movement_type: 'out', total_quantity: '50' }],
      };
      const mockRecentResult = {
        rows: [
          {
            id: 1,
            product_name: 'Widget A',
            sku: 'PROD-001',
            movement_type: 'in',
            quantity: '25',
            created_at: new Date('2024-01-01'),
          },
        ],
      };
      mockPool.query
        .mockResolvedValueOnce(mockStatsResult)
        .mockResolvedValueOnce(mockTypeResult)
        .mockResolvedValueOnce(mockRecentResult);

      const result = await InventoryReportingService.getStockMovementSummary(1);

      expect(result.total_movements).toBe(20);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('sm.product_id ='),
        expect.arrayContaining([1, 50])
      );
    });

    it('should return stock movement summary with custom limit', async () => {
      const mockStatsResult = {
        rows: [{ total_movements: '100', stock_in: '500', stock_out: '300' }],
      };
      const mockTypeResult = {
        rows: [{ movement_type: 'in', total_quantity: '500' }, { movement_type: 'out', total_quantity: '300' }],
      };
      const mockRecentResult = {
        rows: [],
      };
      mockPool.query
        .mockResolvedValueOnce(mockStatsResult)
        .mockResolvedValueOnce(mockTypeResult)
        .mockResolvedValueOnce(mockRecentResult);

      await InventoryReportingService.getStockMovementSummary(undefined, 25);

      expect(mockPool.query).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([25])
      );
    });
  });

  describe('getProductStockStatus', () => {
    it('should return product stock status', async () => {
      const mockResult = {
        rows: [
          {
            product_id: 1,
            product_name: 'Widget A',
            sku: 'PROD-001',
            category: 'Electronics',
            reorder_level: 10,
            quantity: 100,
            available_quantity: 95,
            stock_status: 'in_stock',
          },
          {
            product_id: 2,
            product_name: 'Widget B',
            sku: 'PROD-002',
            category: 'Electronics',
            reorder_level: 10,
            quantity: 5,
            available_quantity: 5,
            stock_status: 'low_stock',
          },
        ],
      };
      mockPool.query.mockResolvedValue(mockResult);

      const result = await InventoryReportingService.getProductStockStatus();

      expect(result).toHaveLength(2);
      expect(result[0].stock_status).toBe('in_stock');
      expect(result[1].stock_status).toBe('low_stock');
      expect(mockPool.query).toHaveBeenCalled();
    });
  });

  describe('getInventoryValueSummary', () => {
    it('should return inventory value summary', async () => {
      const mockResult = {
        rows: [
          {
            total_products: '50',
            total_quantity: '5000',
            total_base_value: '100000',
            total_selling_value: '150000',
            average_product_value: '3000',
          },
        ],
      };
      mockPool.query.mockResolvedValue(mockResult);

      const result = await InventoryReportingService.getInventoryValueSummary();

      expect(result).toEqual({
        total_products: 50,
        total_quantity: 5000,
        total_base_value: 100000,
        total_selling_value: 150000,
        average_product_value: 3000,
      });
      expect(mockPool.query).toHaveBeenCalled();
    });
  });
});
