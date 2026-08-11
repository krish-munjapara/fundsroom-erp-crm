import { ProductService } from '../services/productService';
import { pool } from '../config/database';

jest.mock('../config/database');

describe('ProductService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProduct', () => {
    test('should create a product successfully', async () => {
      const mockProduct = {
        id: 1,
        sku: 'PROD-001',
        name: 'Test Product',
        unit_price: 100,
        tax_rate: 18,
        unit: 'pcs',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (pool.query as jest.Mock).mockResolvedValue({
        rows: [mockProduct],
      });

      const result = await ProductService.createProduct({
        sku: 'PROD-001',
        name: 'Test Product',
        category: 'General',
        unit_price: 100,
        current_stock: 0,
        minimum_stock: 10,
        location: 'Warehouse A',
      });

      expect(result).toEqual(mockProduct);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO products'),
        expect.any(Array)
      );
    });
  });

  describe('getAllProducts', () => {
    test('should return paginated products', async () => {
      const mockProducts = [
        { id: 1, sku: 'PROD-001', name: 'Product A' },
        { id: 2, sku: 'PROD-002', name: 'Product B' },
      ];

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({ rows: mockProducts });

      const result = await ProductService.getAllProducts({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockProducts);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        pages: 1,
      });
    });
  });

  describe('getProductById', () => {
    test('should return product by ID', async () => {
      const mockProduct = {
        id: 1,
        sku: 'PROD-001',
        name: 'Test Product',
      };

      (pool.query as jest.Mock).mockResolvedValue({
        rows: [mockProduct],
      });

      const result = await ProductService.getProductById(1);

      expect(result).toEqual(mockProduct);
    });

    test('should return null when product not found', async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [],
      });

      const result = await ProductService.getProductById(999);

      expect(result).toBeNull();
    });
  });

  describe('updateProduct', () => {
    test('should update product successfully', async () => {
      const mockUpdatedProduct = {
        id: 1,
        name: 'Updated Product',
        selling_price: 200,
      };

      (pool.query as jest.Mock).mockResolvedValue({
        rows: [mockUpdatedProduct],
      });

      const result = await ProductService.updateProduct(1, {
        name: 'Updated Product',
        unit_price: 200,
      });

      expect(result).toEqual(mockUpdatedProduct);
    });
  });

  describe('deleteProduct', () => {
    test('should delete product successfully', async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rowCount: 1,
      });

      const result = await ProductService.deleteProduct(1);

      expect(result).toBe(true);
    });
  });

  describe('getActiveProducts', () => {
    test('should return only active products', async () => {
      const mockProducts = [
        { id: 1, name: 'Active Product', is_active: true },
        { id: 2, name: 'Another Active', is_active: true },
      ];

      (pool.query as jest.Mock).mockResolvedValue({
        rows: mockProducts,
      });

      const result = await ProductService.getActiveProducts();

      expect(result).toEqual(mockProducts);
      expect(pool.query).toHaveBeenCalled();
    });
  });
});
