import { pool } from '../config/database';
import { StockMovementSummary } from '../types';

export class InventoryReportingService {
  static async getStockMovementSummary(productId?: number, limit: number = 50): Promise<StockMovementSummary> {
    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (productId) {
      whereClause = `WHERE sm.product_id = $${paramIndex++}`;
      params.push(productId);
    }

    // Get movement stats
    const statsQuery = `
      SELECT
        COUNT(*) as total_movements,
        COALESCE(SUM(CASE WHEN movement_type = 'in' THEN quantity ELSE 0 END), 0) as stock_in,
        COALESCE(SUM(CASE WHEN movement_type = 'out' THEN quantity ELSE 0 END), 0) as stock_out
      FROM stock_movements sm
      ${whereClause}
    `;
    const statsResult = await pool.query(statsQuery, params);
    const statsRow = statsResult.rows[0];

    // Get movement by type
    const typeQuery = `
      SELECT
        movement_type,
        SUM(quantity) as total_quantity
      FROM stock_movements sm
      ${whereClause}
      GROUP BY movement_type
    `;
    const typeResult = await pool.query(typeQuery, params);
    const movementsByType: any = {};
    typeResult.rows.forEach(row => {
      movementsByType[row.movement_type] = parseInt(row.total_quantity);
    });

    // Get recent movements
    const recentQuery = `
      SELECT
        sm.id,
        p.name as product_name,
        p.sku,
        sm.movement_type,
        sm.quantity,
        sm.created_at
      FROM stock_movements sm
      JOIN products p ON sm.product_id = p.id
      ${whereClause}
      ORDER BY sm.created_at DESC
      LIMIT $${paramIndex++}
    `;
    params.push(limit);
    const recentResult = await pool.query(recentQuery, params);
    const recentMovements = recentResult.rows.map(row => ({
      id: row.id,
      product_name: row.product_name,
      sku: row.sku,
      movement_type: row.movement_type,
      quantity: parseInt(row.quantity),
      created_at: row.created_at,
    }));

    return {
      total_movements: parseInt(statsRow.total_movements) || 0,
      stock_in: parseInt(statsRow.stock_in) || 0,
      stock_out: parseInt(statsRow.stock_out) || 0,
      movements_by_type: movementsByType,
      recent_movements: recentMovements,
    };
  }

  static async getProductStockStatus(): Promise<any[]> {
    const query = `
      SELECT
        p.id as product_id,
        p.name as product_name,
        p.sku,
        p.category,
        p.reorder_level,
        i.quantity,
        i.available_quantity,
        CASE
          WHEN i.available_quantity = 0 THEN 'out_of_stock'
          WHEN i.available_quantity <= p.reorder_level THEN 'low_stock'
          ELSE 'in_stock'
        END as stock_status
      FROM products p
      LEFT JOIN inventory i ON p.id = i.product_id
      WHERE p.is_active = true
      ORDER BY
        CASE
          WHEN i.available_quantity = 0 THEN 1
          WHEN i.available_quantity <= p.reorder_level THEN 2
          ELSE 3
        END,
        p.name
    `;

    const result = await pool.query(query);
    return result.rows;
  }

  static async getInventoryValueSummary(): Promise<any> {
    const query = `
      SELECT
        COUNT(*) as total_products,
        SUM(i.quantity) as total_quantity,
        SUM(i.quantity * p.base_price) as total_base_value,
        SUM(i.quantity * p.selling_price) as total_selling_value,
        AVG(i.quantity * p.selling_price) as average_product_value
      FROM inventory i
      JOIN products p ON i.product_id = p.id
      WHERE p.is_active = true
    `;

    const result = await pool.query(query);
    const row = result.rows[0];
    
    return {
      total_products: parseInt(row.total_products),
      total_quantity: parseInt(row.total_quantity) || 0,
      total_base_value: parseFloat(row.total_base_value) || 0,
      total_selling_value: parseFloat(row.total_selling_value) || 0,
      average_product_value: parseFloat(row.average_product_value) || 0,
    };
  }
}
