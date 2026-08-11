import { pool } from '../config/database';
import type { Challan, ChallanItem, CreateChallanDto, UpdateChallanDto, PaginatedResponse } from '../types';
import { AppError } from '../middleware/errorHandler';

export class ChallanService {
  static generateChallanNumber(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `CHL-${year}${month}${day}-${random}`;
  }

  static async getAllChallans(params?: { page?: number; limit?: number; search?: string; status?: string }): Promise<PaginatedResponse<Challan>> {
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const offset = (page - 1) * limit;
    const search = params?.search;
    const status = params?.status;

    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereClause += ` AND (c.challan_number ILIKE $${paramCount} OR cu.company_name ILIKE $${paramCount})`;
      queryParams.push(`%${search}%`);
    }

    if (status) {
      paramCount++;
      whereClause += ` AND c.status = $${paramCount}`;
      queryParams.push(status);
    }

    const countQuery = `
      SELECT COUNT(*) as total
      FROM challans c
      LEFT JOIN customers cu ON c.customer_id = cu.id
      ${whereClause}
    `;

    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    const dataQuery = `
      SELECT 
        c.*,
        cu.company_name as customer_name,
        cu.contact_person as customer_contact,
        cu.email as customer_email
      FROM challans c
      LEFT JOIN customers cu ON c.customer_id = cu.id
      ${whereClause}
      ORDER BY c.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(limit, offset);
    const dataResult = await pool.query(dataQuery, queryParams);

    return {
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  static async getChallanById(id: number): Promise<Challan | null> {
    const query = `
      SELECT 
        c.*,
        cu.company_name as customer_name,
        cu.contact_person as customer_contact,
        cu.email as customer_email,
        cu.phone as customer_phone,
        cu.address as customer_address
      FROM challans c
      LEFT JOIN customers cu ON c.customer_id = cu.id
      WHERE c.id = $1
    `;

    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) return null;

    const challan = result.rows[0];

    // Get items
    const itemsQuery = `
      SELECT * FROM challan_items WHERE challan_id = $1 ORDER BY id
    `;
    const itemsResult = await pool.query(itemsQuery, [id]);

    return {
      ...challan,
      items: itemsResult.rows,
    };
  }

  static async createChallan(data: CreateChallanDto, userId: number): Promise<Challan> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get product details for snapshot
      const productIds = data.items.map(item => item.product_id);
      const productsQuery = `
        SELECT id, name, sku, unit_price, current_stock 
        FROM products 
        WHERE id = ANY($1)
      `;
      const productsResult = await client.query(productsQuery, [productIds]);
      const productsMap = new Map(productsResult.rows.map(p => [p.id, p]));

      // Calculate totals and create items
      let totalItems = 0;
      let totalQuantity = 0;
      let totalAmount = 0;

      const challanNumber = this.generateChallanNumber();

      const challanQuery = `
        INSERT INTO challans (challan_number, customer_id, status, total_items, total_quantity, total_amount, created_by, notes)
        VALUES ($1, $2, 'draft', $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const challanResult = await client.query(challanQuery, [
        challanNumber,
        data.customer_id,
        totalItems,
        totalQuantity,
        totalAmount,
        userId,
        data.notes || null,
      ]);

      const challan = challanResult.rows[0];

      // Insert items with product snapshot
      for (const item of data.items) {
        const product = productsMap.get(item.product_id);
        if (!product) {
          throw new Error(`Product with ID ${item.product_id} not found`);
        }

        const itemTotal = product.unit_price * item.quantity;
        totalItems++;
        totalQuantity += item.quantity;
        totalAmount += itemTotal;

        const itemQuery = `
          INSERT INTO challan_items (challan_id, product_id, product_name, sku, unit_price, quantity, total)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        await client.query(itemQuery, [
          challan.id,
          item.product_id,
          product.name,
          product.sku,
          product.unit_price,
          item.quantity,
          itemTotal,
        ]);
      }

      // Update challan totals
      const updateQuery = `
        UPDATE challans
        SET total_items = $1, total_quantity = $2, total_amount = $3
        WHERE id = $4
      `;
      await client.query(updateQuery, [totalItems, totalQuantity, totalAmount, challan.id]);

      await client.query('COMMIT');

      const result = await this.getChallanById(challan.id);
      if (!result) throw new Error('Failed to retrieve created challan');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateChallan(id: number, data: UpdateChallanDto): Promise<Challan> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const existingChallan = await this.getChallanById(id);
      if (!existingChallan) {
        throw new AppError('Challan not found', 404);
      }

      if (existingChallan.status !== 'draft') {
        throw new AppError('Only draft challans can be updated', 409);
      }

      let totalItems = 0;
      let totalQuantity = 0;
      let totalAmount = 0;

      // Delete existing items
      await client.query('DELETE FROM challan_items WHERE challan_id = $1', [id]);

      // Add new items if provided
      if (data.items && data.items.length > 0) {
        const productIds = data.items.map(item => item.product_id);
        const productsQuery = `
          SELECT id, name, sku, unit_price 
          FROM products 
          WHERE id = ANY($1)
        `;
        const productsResult = await client.query(productsQuery, [productIds]);
        const productsMap = new Map(productsResult.rows.map(p => [p.id, p]));

        for (const item of data.items) {
          const product = productsMap.get(item.product_id);
          if (!product) {
            throw new Error(`Product with ID ${item.product_id} not found`);
          }

          const itemTotal = product.unit_price * item.quantity;
          totalItems++;
          totalQuantity += item.quantity;
          totalAmount += itemTotal;

          const itemQuery = `
            INSERT INTO challan_items (challan_id, product_id, product_name, sku, unit_price, quantity, total)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
          `;
          await client.query(itemQuery, [
            id,
            item.product_id,
            product.name,
            product.sku,
            product.unit_price,
            item.quantity,
            itemTotal,
          ]);
        }
      }

      // Update challan
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramCount = 0;

      if (data.customer_id !== undefined) {
        paramCount++;
        updateFields.push(`customer_id = $${paramCount}`);
        updateValues.push(data.customer_id);
      }

      if (data.notes !== undefined) {
        paramCount++;
        updateFields.push(`notes = $${paramCount}`);
        updateValues.push(data.notes);
      }

      paramCount++;
      updateFields.push(`total_items = $${paramCount}`);
      updateValues.push(totalItems);

      paramCount++;
      updateFields.push(`total_quantity = $${paramCount}`);
      updateValues.push(totalQuantity);

      paramCount++;
      updateFields.push(`total_amount = $${paramCount}`);
      updateValues.push(totalAmount);

      paramCount++;
      updateValues.push(id);

      if (updateFields.length > 0) {
        const updateQuery = `
          UPDATE challans
          SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
          WHERE id = $${paramCount}
        `;
        await client.query(updateQuery, updateValues);
      }

      await client.query('COMMIT');

      const result = await this.getChallanById(id);
      if (!result) throw new Error('Failed to retrieve updated challan');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async confirmChallan(id: number, userId: number): Promise<Challan> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const challan = await this.getChallanById(id);
      if (!challan) {
        throw new AppError('Challan not found', 404);
      }

      if (challan.status !== 'draft') {
        throw new AppError('Only draft challans can be confirmed', 409);
      }

      if (!challan.items || challan.items.length === 0) {
        throw new AppError('Challan has no items', 400);
      }

      // Validate stock for all items
      for (const item of challan.items) {
        const stockQuery = `
          SELECT current_stock FROM products WHERE id = $1 FOR UPDATE
        `;
        const stockResult = await client.query(stockQuery, [item.product_id]);
        const product = stockResult.rows[0];

        if (!product) {
          throw new AppError(`Product with ID ${item.product_id} not found`, 404);
        }

        if (product.current_stock < item.quantity) {
          throw new AppError(
            `Insufficient stock for ${item.product_name}. Available: ${product.current_stock}, Requested: ${item.quantity}`,
            409
          );
        }
      }

      // Deduct stock and create stock movements
      for (const item of challan.items) {
        // Deduct stock
        const updateStockQuery = `
          UPDATE products
          SET current_stock = current_stock - $1, updated_at = CURRENT_TIMESTAMP
          WHERE id = $2
        `;
        await client.query(updateStockQuery, [item.quantity, item.product_id]);

        await client.query(
          `UPDATE inventory
           SET quantity = quantity - $1, last_stock_update = CURRENT_TIMESTAMP
           WHERE product_id = $2`,
          [item.quantity, item.product_id]
        );

        // Create stock movement
        const movementQuery = `
          INSERT INTO stock_movements (product_id, quantity, movement_type, notes, created_by)
          VALUES ($1, $2, 'out', $3, $4)
        `;
        await client.query(movementQuery, [
          item.product_id,
          item.quantity,
          `Sales Challan ${challan.challan_number}`,
          userId,
        ]);
      }

      // Update challan status
      const updateChallanQuery = `
        UPDATE challans
        SET status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;
      await client.query(updateChallanQuery, [id]);

      await client.query('COMMIT');

      const result = await this.getChallanById(id);
      if (!result) throw new Error('Failed to retrieve confirmed challan');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async cancelChallan(id: number): Promise<Challan> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const challan = await this.getChallanById(id);
      if (!challan) {
        throw new AppError('Challan not found', 404);
      }

      if (challan.status === 'cancelled') {
        throw new AppError('Challan is already cancelled', 409);
      }

      if (challan.status === 'confirmed') {
        throw new AppError('Confirmed challans cannot be cancelled. Please contact administrator.', 409);
      }

      // Update challan status
      const updateQuery = `
        UPDATE challans
        SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;
      await client.query(updateQuery, [id]);

      await client.query('COMMIT');

      const result = await this.getChallanById(id);
      if (!result) throw new Error('Failed to retrieve cancelled challan');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async deleteChallan(id: number): Promise<boolean> {
    const challan = await this.getChallanById(id);
    if (!challan) return false;

    if (challan.status !== 'draft') {
      throw new AppError('Only draft challans can be deleted', 409);
    }

    const query = 'DELETE FROM challans WHERE id = $1';
    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
