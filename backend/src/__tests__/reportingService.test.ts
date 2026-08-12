import { ReportingService } from '../services/reportingService';

// Mock the database pool
jest.mock('../config/database', () => ({
  pool: {
    query: jest.fn(),
  },
}));

describe('ReportingService', () => {
  const mockPool = require('../config/database').pool;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getSalesReport', () => {
    it('should return sales report with no filters', async () => {
      const mockStatsResult = {
        rows: [{
          total_orders: '100',
          total_revenue: '50000',
          average_order_value: '500',
          pending_order_value: '5000',
        }],
      };
      const mockStatusResult = {
        rows: [
          { status: 'pending', count: '10' },
          { status: 'confirmed', count: '50' },
          { status: 'delivered', count: '40' },
        ],
      };
      const mockMonthlyResult = {
        rows: [
          { month: '2024-01', revenue: '10000' },
          { month: '2024-02', revenue: '15000' },
        ],
      };
      const mockCustomerSalesResult = { rows: [] };
      const mockProductSalesResult = { rows: [] };
      const mockTrendResult = { rows: [] };
      mockPool.query
        .mockResolvedValueOnce(mockStatsResult)
        .mockResolvedValueOnce(mockStatusResult)
        .mockResolvedValueOnce(mockMonthlyResult)
        .mockResolvedValueOnce(mockCustomerSalesResult)
        .mockResolvedValueOnce(mockProductSalesResult)
        .mockResolvedValueOnce(mockTrendResult);

      const result = await ReportingService.getSalesReport();

      expect(result).toEqual({
        total_orders: 100,
        total_revenue: 50000,
        average_order_value: 500,
        pending_order_value: 5000,
        pending_orders: 10,
        confirmed_orders: 50,
        orders_by_status: { pending: 10, confirmed: 50, delivered: 40 },
        revenue_by_month: [
          { month: '2024-01', revenue: 10000 },
          { month: '2024-02', revenue: 15000 },
        ],
        sales_trend: [],
        sales_by_customer: [],
        sales_by_product: [],
      });
      expect(mockPool.query).toHaveBeenCalledTimes(6);
      expect(mockPool.query.mock.calls[0][0]).toContain("status IN ('confirmed'");
    });

    it('should return sales report with date filters', async () => {
      const mockStatsResult = {
        rows: [{ total_orders: '50', total_revenue: '25000', average_order_value: '500', pending_order_value: '0' }],
      };
      const mockStatusResult = {
        rows: [{ status: 'confirmed', count: '30' }, { status: 'delivered', count: '20' }],
      };
      const mockMonthlyResult = {
        rows: [{ month: '2024-03', revenue: '25000' }],
      };
      mockPool.query
        .mockResolvedValueOnce(mockStatsResult)
        .mockResolvedValueOnce(mockStatusResult)
        .mockResolvedValueOnce(mockMonthlyResult)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const filters = {
        start_date: new Date('2024-03-01'),
        end_date: new Date('2024-03-31'),
      };

      const result = await ReportingService.getSalesReport(filters);

      expect(result.total_orders).toBe(50);
      expect(result.sales_trend).toEqual([]);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('order_date::date >='),
        expect.arrayContaining([expect.any(Date), expect.any(Date)])
      );
    });

    it('should return sales report with status filter', async () => {
      const mockStatsResult = {
        rows: [{ total_orders: '30', total_revenue: '15000', average_order_value: '500', pending_order_value: '0' }],
      };
      const mockStatusResult = {
        rows: [{ status: 'confirmed', count: '30' }],
      };
      const mockMonthlyResult = {
        rows: [],
      };
      mockPool.query
        .mockResolvedValueOnce(mockStatsResult)
        .mockResolvedValueOnce(mockStatusResult)
        .mockResolvedValueOnce(mockMonthlyResult)
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [] });

      const filters = { status: 'confirmed' };

      const result = await ReportingService.getSalesReport(filters);

      expect(result.total_orders).toBe(30);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('status ='),
        expect.arrayContaining(['confirmed'])
      );
    });
  });

  describe('getCustomerReport', () => {
    it('should return customer report', async () => {
      const mockStatsResult = {
        rows: [{ total_customers: '25', active_customers: '20', total_credit_limit: '500000' }],
      };
      const mockTopCustomersResult = {
        rows: [
          {
            customer_id: 1,
            company_name: 'Acme Corp',
            total_orders: '10',
            total_spent: '15000',
          },
        ],
      };
      mockPool.query
        .mockResolvedValueOnce(mockStatsResult)
        .mockResolvedValueOnce(mockTopCustomersResult);

      const result = await ReportingService.getCustomerReport();

      expect(result).toEqual({
        total_customers: 25,
        active_customers: 20,
        total_credit_limit: 500000,
        top_customers: [
          {
            customer_id: 1,
            company_name: 'Acme Corp',
            total_orders: 10,
            total_spent: 15000,
          },
        ],
      });
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('should return customer report for specific customer', async () => {
      const mockStatsResult = {
        rows: [{ total_customers: '1', active_customers: '1', total_credit_limit: '100000' }],
      };
      const mockTopCustomersResult = {
        rows: [
          {
            customer_id: 1,
            company_name: 'Acme Corp',
            total_orders: '5',
            total_spent: '5000',
          },
        ],
      };
      mockPool.query
        .mockResolvedValueOnce(mockStatsResult)
        .mockResolvedValueOnce(mockTopCustomersResult);

      const filters = { customer_id: 1 };

      const result = await ReportingService.getCustomerReport(filters);

      expect(result.total_customers).toBe(1);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('c.id ='),
        expect.arrayContaining([1])
      );
    });
  });

  describe('getProductPerformanceReport', () => {
    it('should return product performance report', async () => {
      const mockStatsResult = {
        rows: [{ total_products: '50', active_products: '45' }],
      };
      const mockTopProductsResult = {
        rows: [
          {
            product_id: 1,
            product_name: 'Widget A',
            sku: 'PROD-001',
            total_quantity_sold: '100',
            total_revenue: '15000',
          },
        ],
      };
      mockPool.query
        .mockResolvedValueOnce(mockStatsResult)
        .mockResolvedValueOnce(mockTopProductsResult);

      const result = await ReportingService.getProductPerformanceReport();

      expect(result).toEqual({
        total_products: 50,
        active_products: 45,
        top_selling_products: [
          {
            product_id: 1,
            product_name: 'Widget A',
            sku: 'PROD-001',
            total_quantity_sold: 100,
            total_revenue: 15000,
          },
        ],
      });
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('should return product performance report for specific product', async () => {
      const mockStatsResult = {
        rows: [{ total_products: '1', active_products: '1' }],
      };
      const mockTopProductsResult = {
        rows: [
          {
            product_id: 1,
            product_name: 'Widget A',
            sku: 'PROD-001',
            total_quantity_sold: '50',
            total_revenue: '7500',
          },
        ],
      };
      mockPool.query
        .mockResolvedValueOnce(mockStatsResult)
        .mockResolvedValueOnce(mockTopProductsResult);

      const filters = { product_id: 1 };

      const result = await ReportingService.getProductPerformanceReport(filters);

      expect(result.total_products).toBe(1);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('p.id ='),
        expect.arrayContaining([1])
      );
    });
  });

  describe('getInventoryReport', () => {
    it('should return inventory report', async () => {
      const mockStatsResult = {
        rows: [{ total_products: '50', low_stock_count: '5', out_of_stock_count: '2', total_inventory_value: '100000' }],
      };
      const mockStockSummaryResult = {
        rows: [
          {
            product_id: 1,
            product_name: 'Widget A',
            sku: 'PROD-001',
            quantity: '100',
            available_quantity: '95',
            value: '5000',
          },
        ],
      };
      mockPool.query
        .mockResolvedValueOnce(mockStatsResult)
        .mockResolvedValueOnce(mockStockSummaryResult);

      const result = await ReportingService.getInventoryReport();

      expect(result).toEqual({
        total_products: 50,
        low_stock_count: 5,
        out_of_stock_count: 2,
        total_inventory_value: 100000,
        stock_summary: [
          {
            product_id: 1,
            product_name: 'Widget A',
            sku: 'PROD-001',
            quantity: 100,
            available_quantity: 95,
            value: 5000,
          },
        ],
      });
      expect(mockPool.query).toHaveBeenCalledTimes(2);
    });

    it('should return inventory report for specific product', async () => {
      const mockStatsResult = {
        rows: [{ total_products: '1', low_stock_count: '0', out_of_stock_count: '0', total_inventory_value: '5000' }],
      };
      const mockStockSummaryResult = {
        rows: [
          {
            product_id: 1,
            product_name: 'Widget A',
            sku: 'PROD-001',
            quantity: '100',
            available_quantity: '95',
            value: '5000',
          },
        ],
      };
      mockPool.query
        .mockResolvedValueOnce(mockStatsResult)
        .mockResolvedValueOnce(mockStockSummaryResult);

      const filters = { product_id: 1 };

      const result = await ReportingService.getInventoryReport(filters);

      expect(result.total_products).toBe(1);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('p.id ='),
        expect.arrayContaining([1])
      );
    });
  });
});
