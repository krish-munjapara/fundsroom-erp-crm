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

    const query = `
      WITH movement_stats AS (
        SELECT
          COUNT(*) as total_movements,
          SUM(CASE WHEN movement_type = 'in' THEN quantity ELSE 0 END) as stock_in,
          SUM(CASE WHEN movement_type = 'out' THEN quantity ELSE 0 END) as stock_out
        FROM stock_movements sm
        ${whereClause}
      ),
      movement_by_type AS (
        SELECT
          movement_type,
          SUM(quantity) as total_quantity
        FROM stock_movements sm
        ${whereClause}
        GROUP BY movement_type
      ),
      recent_movements AS (
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
      )
      SELECT
        ms.total_movements,
        COALESCE(ms.stock_in, 0) as stock_in,
        COALESCE(ms.stock_out, 0) as stock_out,
        COALESCE(json_object_agg(mbt.movement_type, mbt.total_quantity), '{}'::json) as movements_by_type,
        COALESCE(json_agg(json_build_object(
          'id', rm.id,
          'product_name', rm.product_name,
          'sku', rm.sku,
          'movement_type', rm.movement_type,
          'quantity', rm.quantity,
          'created_at', rm.created_at
        )) FILTER (WHERE rm.id IS NOT NULL), '[]'::json) as recent_movements
      FROM movement_stats ms
      CROSS JOIN movement_by_type mbt
      CROSS JOIN recent_movements rm
      GROUP BY ms.total_movements, ms.stock_in, ms.stock_out
    `;

    params.push(limit);
    const result = await pool.query(query, params);
    const row = result.rows[0];

    return {
      total_movements: parseInt(row.total_movements),
      stock_in: parseInt(row.stock_in),
      stock_out: parseInt(row.stock_out),
      movements_by_type: row.movements_by_type,
      recent_movements: row.recent_movements,
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
