import { pool } from '../config/database';
import { Inventory, CreateInventoryDto, UpdateInventoryDto, StockMovementDto } from '../types';

export class InventoryService {
  static async createInventory(inventoryData: CreateInventoryDto): Promise<Inventory> {
    const { product_id, quantity = 0, location, warehouse } = inventoryData;

    const query = `
      INSERT INTO inventory (product_id, quantity, location, warehouse)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (product_id, location) 
      DO UPDATE SET 
        quantity = inventory.quantity + EXCLUDED.quantity,
        last_stock_update = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const values = [product_id, quantity, location, warehouse];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getAllInventory(): Promise<Inventory[]> {
    const query = `
      SELECT i.*, p.name as product_name, p.sku 
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      ORDER BY i.last_stock_update DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  static async getInventoryByProductId(productId: number): Promise<Inventory | null> {
    const query = 'SELECT * FROM inventory WHERE product_id = $1';
    const result = await pool.query(query, [productId]);
    return result.rows[0] || null;
  }

  static async updateInventory(id: number, updates: UpdateInventoryDto): Promise<Inventory | null> {
    const { quantity, reserved_quantity, location, warehouse } = updates;

    const query = `
      UPDATE inventory
      SET 
        quantity = COALESCE($1, quantity),
        reserved_quantity = COALESCE($2, reserved_quantity),
        location = COALESCE($3, location),
        warehouse = COALESCE($4, warehouse),
        last_stock_update = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `;

    const values = [quantity, reserved_quantity, location, warehouse, id];
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async updateStockQuantity(productId: number, quantity: number): Promise<Inventory | null> {
    const query = `
      UPDATE inventory
      SET 
        quantity = quantity + $1,
        last_stock_update = CURRENT_TIMESTAMP
      WHERE product_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [quantity, productId]);
    return result.rows[0] || null;
  }

  static async recordStockMovement(movementData: StockMovementDto, userId: number): Promise<void> {
    const { product_id, quantity, movement_type, reference_type, reference_id, notes } = movementData;

    const query = `
      INSERT INTO stock_movements (
        product_id, movement_type, quantity, reference_type, reference_id, notes, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;

    const values = [product_id, movement_type, quantity, reference_type, reference_id, notes, userId];
    await pool.query(query, values);
  }

  static async getLowStockProducts(threshold: number = 10): Promise<any[]> {
    const query = `
      SELECT i.*, p.name as product_name, p.sku, p.reorder_level
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE i.available_quantity <= $1
      ORDER BY i.available_quantity ASC
    `;

    const result = await pool.query(query, [threshold]);
    return result.rows;
  }

  static async getStockMovements(productId?: number, limit: number = 50): Promise<any[]> {
    let query = `
      SELECT sm.*, p.name as product_name, p.sku, u.email as created_by_email
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.created_by = u.id
    `;

    const values: any[] = [];

    if (productId) {
      query += ' WHERE sm.product_id = $1';
      values.push(productId);
    }

    query += ' ORDER BY sm.created_at DESC LIMIT $' + (values.length + 1);
    values.push(limit);

    const result = await pool.query(query, values);
    return result.rows;
  }

  static async deleteInventory(id: number): Promise<boolean> {
    const query = 'DELETE FROM inventory WHERE id = $1';
    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
