import { InventoryService } from '../services/inventoryService';
import { pool } from '../config/database';

jest.mock('../config/database');

describe('InventoryService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createInventory', () => {
    test('should create inventory record successfully', async () => {
      const mockInventory = {
        id: 1,
        product_id: 1,
        quantity: 100,
        reserved_quantity: 0,
        available_quantity: 100,
        location: 'Warehouse A',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (pool.query as jest.Mock).mockResolvedValue({
        rows: [mockInventory],
      });

      const result = await InventoryService.createInventory({
        product_id: 1,
        quantity: 100,
        location: 'Warehouse A',
      });

      expect(result).toEqual(mockInventory);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO inventory'),
        expect.any(Array)
      );
    });
  });

  describe('getAllInventory', () => {
    test('should return all inventory records', async () => {
      const mockInventory = [
        { id: 1, product_id: 1, quantity: 100, available_quantity: 100 },
        { id: 2, product_id: 2, quantity: 50, available_quantity: 50 },
      ];

      (pool.query as jest.Mock).mockResolvedValue({
        rows: mockInventory,
      });

      const result = await InventoryService.getAllInventory();

      expect(result).toEqual(mockInventory);
      expect(pool.query).toHaveBeenCalled();
    });
  });

  describe('updateStockQuantity', () => {
    test('should update stock quantity successfully', async () => {
      const mockInventory = {
        id: 1,
        product_id: 1,
        quantity: 150,
        available_quantity: 150,
      };

      (pool.query as jest.Mock).mockResolvedValue({
        rows: [mockInventory],
      });

      const result = await InventoryService.updateStockQuantity(1, 50);

      expect(result).toEqual(mockInventory);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE inventory'),
        expect.any(Array)
      );
    });
  });

  describe('recordStockMovement', () => {
    test('should record stock movement successfully', async () => {
      (pool.query as jest.Mock).mockResolvedValue({});

      await InventoryService.recordStockMovement(
        {
          product_id: 1,
          quantity: 50,
          movement_type: 'in',
          reference_type: 'purchase',
          notes: 'Stock purchase',
        },
        1
      );

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO stock_movements'),
        expect.any(Array)
      );
    });
  });

  describe('getLowStockProducts', () => {
    test('should return low stock products', async () => {
      const mockLowStock = [
        { id: 1, product_id: 1, available_quantity: 5, product_name: 'Low Stock Item' },
      ];

      (pool.query as jest.Mock).mockResolvedValue({
        rows: mockLowStock,
      });

      const result = await InventoryService.getLowStockProducts(10);

      expect(result).toEqual(mockLowStock);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE i.available_quantity <= $1'),
        [10]
      );
    });
  });

  describe('getStockMovements', () => {
    test('should return stock movements', async () => {
      const mockMovements = [
        { id: 1, product_id: 1, movement_type: 'in', quantity: 50 },
        { id: 2, product_id: 1, movement_type: 'out', quantity: 20 },
      ];

      (pool.query as jest.Mock).mockResolvedValue({
        rows: mockMovements,
      });

      const result = await InventoryService.getStockMovements(1, 50);

      expect(result).toEqual(mockMovements);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM stock_movements'),
        expect.any(Array)
      );
    });
  });
});
