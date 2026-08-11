import { pool } from '../config/database';
import {
  Order,
  CreateOrderDto,
  UpdateOrderDto,
  OrderItemDto,
  PaginationParams,
  PaginatedResponse,
} from '../types';
import { AppError } from '../middleware/errorHandler';

interface ItemTotals {
  lineSubtotal: number;
  lineTax: number;
  lineTotal: number;
  discountAmount: number;
}

export class OrderService {
  private static calculateItemTotals(
    quantity: number,
    unitPrice: number,
    taxRate = 0,
    discountAmount = 0
  ): ItemTotals {
    const lineSubtotal = quantity * unitPrice - discountAmount;
    const lineTax = lineSubtotal * (taxRate / 100);
    const lineTotal = lineSubtotal + lineTax;
    return { lineSubtotal, lineTax, lineTotal, discountAmount };
  }

  private static async validateCustomer(client: any, customerId: number): Promise<void> {
    const result = await client.query(
      'SELECT id FROM customers WHERE id = $1 AND is_active = true',
      [customerId]
    );
    if (!result.rows[0]) {
      throw new AppError('Customer not found or inactive', 404);
    }
  }

  private static async fetchProductsMap(
    client: any,
    productIds: number[]
  ): Promise<Map<number, any>> {
    const uniqueIds = [...new Set(productIds)];
    const result = await client.query(
      `SELECT id, name, sku, unit_price, current_stock, is_active
       FROM products WHERE id = ANY($1)`,
      [uniqueIds]
    );
    return new Map(result.rows.map((p: any) => [p.id, p]));
  }

  private static resolveItemPricing(
    item: OrderItemDto,
    product: any
  ): { unitPrice: number; taxRate: number; discountAmount: number } {
    return {
      unitPrice: Number(product.unit_price),
      taxRate: item.tax_rate ?? Number(product.tax_rate ?? 0),
      discountAmount: item.item_discount_amount ?? 0,
    };
  }

  static async createOrder(orderData: CreateOrderDto, userId: number): Promise<Order> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const {
        customer_id,
        order_date = new Date(),
        delivery_date,
        notes,
        items,
      } = orderData;

      await this.validateCustomer(client, customer_id);

      const productsMap = await this.fetchProductsMap(
        client,
        items.map((item) => item.product_id)
      );

      let subtotal = 0;
      let tax_amount = 0;
      let discount_amount = 0;

      for (const item of items) {
        const product = productsMap.get(item.product_id);
        if (!product) {
          throw new AppError(`Product with ID ${item.product_id} not found`, 404);
        }
        if (!product.is_active) {
          throw new AppError(`Product "${product.name}" is not active`, 400);
        }
        if (item.quantity <= 0) {
          throw new AppError('Quantity must be greater than 0', 400);
        }

        const { unitPrice, taxRate, discountAmount } = this.resolveItemPricing(item, product);
        const totals = this.calculateItemTotals(item.quantity, unitPrice, taxRate, discountAmount);
        subtotal += totals.lineSubtotal;
        tax_amount += totals.lineTax;
        discount_amount += totals.discountAmount;
      }

      const orderNumberResult = await client.query(
        "SELECT 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(nextval('order_number_seq')::TEXT, 4, '0') as order_number"
      );
      const order_number = orderNumberResult.rows[0].order_number;
      const total_amount = subtotal + tax_amount;

      const orderResult = await client.query(
        `INSERT INTO orders (
          order_number, customer_id, order_date, delivery_date, status,
          subtotal, tax_amount, discount_amount, total_amount, notes, created_by
        )
        VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          order_number,
          customer_id,
          order_date,
          delivery_date ?? null,
          subtotal,
          tax_amount,
          discount_amount,
          total_amount,
          notes ?? null,
          userId,
        ]
      );
      const order = orderResult.rows[0];

      for (const item of items) {
        const product = productsMap.get(item.product_id)!;
        const { unitPrice, taxRate, discountAmount } = this.resolveItemPricing(item, product);
        const totals = this.calculateItemTotals(item.quantity, unitPrice, taxRate, discountAmount);

        await client.query(
          `INSERT INTO order_items (
            order_id, product_id, product_name, sku, quantity, unit_price,
            tax_rate, discount_amount, subtotal, total_amount
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            order.id,
            item.product_id,
            product.name,
            product.sku,
            item.quantity,
            unitPrice,
            taxRate,
            discountAmount,
            totals.lineSubtotal,
            totals.lineTotal,
          ]
        );
      }

      await client.query('COMMIT');

      const created = await this.getOrderById(order.id);
      if (!created) {
        throw new AppError('Failed to retrieve created order', 500);
      }
      return created;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getAllOrders(params: PaginationParams = {}): Promise<PaginatedResponse<Order>> {
    const { page = 1, limit = 10, search = '', sort = 'created_at', order = 'desc', status } = params;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const queryValues: any[] = [];
    let paramIndex = 0;

    if (search) {
      paramIndex++;
      conditions.push(
        `(o.order_number ILIKE $${paramIndex}
          OR c.company_name ILIKE $${paramIndex}
          OR c.contact_person ILIKE $${paramIndex})`
      );
      queryValues.push(`%${search}%`);
    }

    if (status) {
      paramIndex++;
      conditions.push(`o.status = $${paramIndex}`);
      queryValues.push(status);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const allowedSortColumns = ['created_at', 'order_date', 'order_number', 'total_amount', 'status'];
    const sortColumn = allowedSortColumns.includes(sort) ? sort : 'created_at';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM orders o
       JOIN customers c ON o.customer_id = c.id
       ${whereClause}`,
      queryValues
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await pool.query(
      `SELECT o.*, c.company_name as customer_name, c.contact_person as customer_contact,
              c.email as customer_email
       FROM orders o
       JOIN customers c ON o.customer_id = c.id
       ${whereClause}
       ORDER BY o.${sortColumn} ${sortOrder}
       LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}`,
      [...queryValues, limit, offset]
    );

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

  static async getOrderById(id: number): Promise<any | null> {
    const orderResult = await pool.query(
      `SELECT o.*,
              c.company_name as customer_name,
              c.contact_person as customer_contact,
              c.email as customer_email,
              c.phone as customer_phone,
              c.address as customer_address,
              c.tax_id as customer_tax_id,
              u.first_name as created_by_first_name,
              u.last_name as created_by_last_name,
              u.email as created_by_email
       FROM orders o
       JOIN customers c ON o.customer_id = c.id
       LEFT JOIN users u ON o.created_by = u.id
       WHERE o.id = $1`,
      [id]
    );

    if (!orderResult.rows[0]) return null;

    const itemsResult = await pool.query(
      `SELECT oi.*,
              COALESCE(oi.product_name, p.name) as product_name,
              COALESCE(oi.sku, p.sku) as product_sku
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = $1
       ORDER BY oi.id`,
      [id]
    );

    const items = itemsResult.rows.map((item: any) => ({
      ...item,
      line_total: Number(item.total_amount ?? item.subtotal ?? item.quantity * item.unit_price),
    }));

    const totalQuantity = items.reduce((sum: number, item: any) => sum + Number(item.quantity), 0);

    return {
      ...orderResult.rows[0],
      created_by_name: orderResult.rows[0].created_by_first_name
        ? `${orderResult.rows[0].created_by_first_name} ${orderResult.rows[0].created_by_last_name}`.trim()
        : null,
      items,
      total_items: items.length,
      total_quantity: totalQuantity,
    };
  }

  static async getOrderByOrderNumber(orderNumber: string): Promise<any | null> {
    const result = await pool.query(
      `SELECT o.*, c.company_name as customer_name
       FROM orders o
       JOIN customers c ON o.customer_id = c.id
       WHERE o.order_number = $1`,
      [orderNumber]
    );
    if (!result.rows[0]) return null;
    return this.getOrderById(result.rows[0].id);
  }

  static async updateOrder(id: number, updates: UpdateOrderDto, userId: number): Promise<any> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const existingResult = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [id]);
      const existing = existingResult.rows[0];
      if (!existing) {
        throw new AppError('Order not found', 404);
      }

      if (existing.status !== 'pending') {
        throw new AppError('Only pending orders can be edited', 409);
      }

      const { customer_id, order_date, delivery_date, notes, items } = updates;

      if (customer_id !== undefined) {
        await this.validateCustomer(client, customer_id);
      }

      if (items && items.length > 0) {
        const productsMap = await this.fetchProductsMap(
          client,
          items.map((item) => item.product_id)
        );

        let subtotal = 0;
        let tax_amount = 0;
        let discount_amount = 0;

        for (const item of items) {
          const product = productsMap.get(item.product_id);
          if (!product) {
            throw new AppError(`Product with ID ${item.product_id} not found`, 404);
          }
          if (!product.is_active) {
            throw new AppError(`Product "${product.name}" is not active`, 400);
          }
          if (item.quantity <= 0) {
            throw new AppError('Quantity must be greater than 0', 400);
          }

          const { unitPrice, taxRate, discountAmount } = this.resolveItemPricing(item, product);
          const totals = this.calculateItemTotals(item.quantity, unitPrice, taxRate, discountAmount);
          subtotal += totals.lineSubtotal;
          tax_amount += totals.lineTax;
          discount_amount += totals.discountAmount;
        }

        const total_amount = subtotal + tax_amount;

        await client.query('DELETE FROM order_items WHERE order_id = $1', [id]);

        for (const item of items) {
          const product = productsMap.get(item.product_id)!;
          const { unitPrice, taxRate, discountAmount } = this.resolveItemPricing(item, product);
          const totals = this.calculateItemTotals(item.quantity, unitPrice, taxRate, discountAmount);

          await client.query(
            `INSERT INTO order_items (
              order_id, product_id, product_name, sku, quantity, unit_price,
              tax_rate, discount_amount, subtotal, total_amount
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
              id,
              item.product_id,
              product.name,
              product.sku,
              item.quantity,
              unitPrice,
              taxRate,
              discountAmount,
              totals.lineSubtotal,
              totals.lineTotal,
            ]
          );
        }

        await client.query(
          `UPDATE orders
           SET customer_id = COALESCE($1, customer_id),
               order_date = COALESCE($2, order_date),
               delivery_date = COALESCE($3, delivery_date),
               notes = COALESCE($4, notes),
               subtotal = $5,
               tax_amount = $6,
               discount_amount = $7,
               total_amount = $8,
               updated_by = $9,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $10`,
          [
            customer_id ?? null,
            order_date ?? null,
            delivery_date ?? null,
            notes !== undefined ? notes || null : null,
            subtotal,
            tax_amount,
            discount_amount,
            total_amount,
            userId,
            id,
          ]
        );
      } else {
        await client.query(
          `UPDATE orders
           SET customer_id = COALESCE($1, customer_id),
               order_date = COALESCE($2, order_date),
               delivery_date = COALESCE($3, delivery_date),
               notes = COALESCE($4, notes),
               updated_by = $5,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $6`,
          [
            customer_id ?? null,
            order_date ?? null,
            delivery_date ?? null,
            notes !== undefined ? notes || null : null,
            userId,
            id,
          ]
        );
      }

      await client.query('COMMIT');

      const updated = await this.getOrderById(id);
      if (!updated) {
        throw new AppError('Failed to retrieve updated order', 500);
      }
      return updated;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async confirmOrder(id: number, userId: number): Promise<any> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const orderResult = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [id]);
      const order = orderResult.rows[0];
      if (!order) {
        throw new AppError('Order not found', 404);
      }

      if (order.status !== 'pending') {
        throw new AppError('Only pending orders can be confirmed', 409);
      }

      const itemsResult = await client.query(
        `SELECT oi.*,
                COALESCE(oi.product_name, p.name) as product_name
         FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = $1`,
        [id]
      );
      const items = itemsResult.rows;

      if (items.length === 0) {
        throw new AppError('Order has no items', 400);
      }

      for (const item of items) {
        const stockResult = await client.query(
          'SELECT current_stock, name FROM products WHERE id = $1 FOR UPDATE',
          [item.product_id]
        );
        const product = stockResult.rows[0];

        if (!product) {
          throw new AppError(`Product with ID ${item.product_id} not found`, 404);
        }

        if (product.current_stock < item.quantity) {
          throw new AppError(
            `Insufficient stock for ${item.product_name || product.name}. Available: ${product.current_stock}, Requested: ${item.quantity}`,
            409
          );
        }
      }

      for (const item of items) {
        await client.query(
          `UPDATE products
           SET current_stock = current_stock - $1, updated_at = CURRENT_TIMESTAMP
           WHERE id = $2`,
          [item.quantity, item.product_id]
        );

        await client.query(
          `UPDATE inventory
           SET quantity = quantity - $1, last_stock_update = CURRENT_TIMESTAMP
           WHERE product_id = $2`,
          [item.quantity, item.product_id]
        );

        await client.query(
          `INSERT INTO stock_movements (
            product_id, movement_type, quantity, reference_type, reference_id, notes, created_by
          )
          VALUES ($1, 'out', $2, 'order', $3, $4, $5)`,
          [
            item.product_id,
            item.quantity,
            id,
            `Order ${order.order_number} confirmed`,
            userId,
          ]
        );
      }

      await client.query(
        `UPDATE orders
         SET status = 'confirmed', updated_by = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [userId, id]
      );

      await client.query('COMMIT');

      const confirmed = await this.getOrderById(id);
      if (!confirmed) {
        throw new AppError('Failed to retrieve confirmed order', 500);
      }
      return confirmed;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateOrderStatus(id: number, status: string, userId?: number): Promise<Order | null> {
    const existing = await this.getOrderById(id);
    if (!existing) {
      throw new AppError('Order not found', 404);
    }

    if (existing.status === 'confirmed' && status !== existing.status) {
      throw new AppError('Confirmed orders cannot be modified', 409);
    }

    if (status === 'confirmed') {
      return this.confirmOrder(id, userId ?? existing.created_by ?? 1);
    }

    const result = await pool.query(
      `UPDATE orders
       SET status = $1, updated_by = COALESCE($2, updated_by), updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [status, userId ?? null, id]
    );
    return result.rows[0] || null;
  }

  static async deleteOrder(id: number): Promise<boolean> {
    const existing = await this.getOrderById(id);
    if (!existing) return false;

    if (existing.status === 'confirmed') {
      throw new AppError('Confirmed orders cannot be deleted', 409);
    }

    const result = await pool.query('DELETE FROM orders WHERE id = $1', [id]);
    return (result.rowCount ?? 0) > 0;
  }

  static async getOrdersByCustomerId(customerId: number): Promise<Order[]> {
    const result = await pool.query(
      `SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC`,
      [customerId]
    );
    return result.rows;
  }

  static async getOrderStats(): Promise<any> {
    const result = await pool.query(`
      SELECT
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
        COALESCE(SUM(CASE WHEN status IN ('confirmed', 'processing', 'shipped', 'delivered') THEN total_amount ELSE 0 END), 0) as total_revenue
      FROM orders
    `);
    return result.rows[0];
  }
}
