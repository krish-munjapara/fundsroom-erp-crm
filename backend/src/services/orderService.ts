import { pool } from '../config/database';
import { Order, CreateOrderDto, UpdateOrderDto, OrderItem, OrderItemDto, PaginationParams, PaginatedResponse } from '../types';

export class OrderService {
  static async createOrder(orderData: CreateOrderDto, userId: number): Promise<Order> {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const {
        customer_id,
        order_date = new Date(),
        delivery_date,
        status = 'pending',
        notes,
        items,
      } = orderData;

      // Generate order number
      const orderNumberResult = await client.query(
        "SELECT 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(nextval('order_number_seq')::TEXT, 4, '0') as order_number"
      );
      const order_number = orderNumberResult.rows[0].order_number;

      // Calculate totals and check inventory
      let subtotal = 0;
      let tax_amount = 0;
      let discount_amount = 0;

      // Check inventory availability for all items first
      for (const item of items) {
        const { product_id, quantity } = item;

        const inventoryQuery = `
          SELECT quantity, reserved_quantity, available_quantity
          FROM inventory
          WHERE product_id = $1
        `;
        const inventoryResult = await client.query(inventoryQuery, [product_id]);

        if (!inventoryResult.rows[0]) {
          throw new Error(`No inventory record found for product ID ${product_id}. Please create an inventory record first.`);
        }

        const inventory = inventoryResult.rows[0];
        if (inventory.available_quantity < quantity) {
          throw new Error(`Insufficient inventory for product ID ${product_id}. Only ${inventory.available_quantity} units are available.`);
        }
      }

      // Create order
      const orderQuery = `
        INSERT INTO orders (
          order_number, customer_id, order_date, delivery_date, status,
          subtotal, tax_amount, discount_amount, total_amount, notes, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const orderValues = [
        order_number,
        customer_id,
        order_date,
        delivery_date,
        status,
        subtotal,
        tax_amount,
        discount_amount,
        subtotal + tax_amount - discount_amount,
        notes,
        userId,
      ];

      const orderResult = await client.query(orderQuery, orderValues);
      const order = orderResult.rows[0];

      // Create order items and reserve inventory
      for (const item of items) {
        const { product_id, quantity, unit_price, tax_rate = 0, item_discount_amount = 0 } = item;

        const itemSubtotal = quantity * unit_price - item_discount_amount;
        const itemTaxAmount = itemSubtotal * (tax_rate / 100);
        const itemTotal = itemSubtotal + itemTaxAmount;

        const itemQuery = `
          INSERT INTO order_items (
            order_id, product_id, quantity, unit_price, tax_rate, discount_amount
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `;

        const itemValues = [order.id, product_id, quantity, unit_price, tax_rate, item_discount_amount];
        await client.query(itemQuery, itemValues);

        // Reserve inventory for this item
        const reserveInventoryQuery = `
          UPDATE inventory
          SET reserved_quantity = reserved_quantity + $1,
              last_stock_update = CURRENT_TIMESTAMP
          WHERE product_id = $2
        `;
        await client.query(reserveInventoryQuery, [quantity, product_id]);

        // Record stock movement
        const movementQuery = `
          INSERT INTO stock_movements (
            product_id, movement_type, quantity, reference_type, reference_id, notes, created_by
          )
          VALUES ($1, 'out', $2, 'order', $3, $4, $5)
        `;
        await client.query(movementQuery, [product_id, quantity, order.id, `Order ${order_number}`, userId]);

        // Update running totals
        subtotal += itemSubtotal;
        tax_amount += itemTaxAmount;
        discount_amount += item_discount_amount;
      }

      // Update order with calculated totals
      const total_amount = subtotal + tax_amount - discount_amount;
      const updateOrderQuery = `
        UPDATE orders
        SET subtotal = $1, tax_amount = $2, discount_amount = $3, total_amount = $4
        WHERE id = $5
        RETURNING *
      `;

      const updateResult = await client.query(updateOrderQuery, [subtotal, tax_amount, discount_amount, total_amount, order.id]);

      await client.query('COMMIT');
      return updateResult.rows[0];

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getAllOrders(params: PaginationParams = {}): Promise<PaginatedResponse<Order>> {
    const { page = 1, limit = 10, search = '', sort = 'created_at', order = 'desc' } = params;
    const offset = (page - 1) * limit;

    let searchQuery = '';
    let searchValues: string[] = [];

    if (search) {
      searchQuery = `
        WHERE o.order_number ILIKE $1
        OR c.company_name ILIKE $1
        OR o.status ILIKE $1
      `;
      searchValues = [`%${search}%`];
    }

    const countQuery = `
      SELECT COUNT(*) FROM orders o
      JOIN customers c ON o.customer_id = c.id
      ${searchQuery}
    `;

    const countResult = await pool.query(countQuery, searchValues);
    const total = parseInt(countResult.rows[0].count);

    const dataQuery = `
      SELECT o.*, c.company_name as customer_name, c.email as customer_email
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      ${searchQuery}
      ORDER BY o.${sort} ${order}
      LIMIT $${searchValues.length + 1} OFFSET $${searchValues.length + 2}
    `;

    const dataResult = await pool.query(dataQuery, [...searchValues, limit, offset]);

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
    const orderQuery = `
      SELECT o.*, c.company_name as customer_name, c.email as customer_email,
             c.phone as customer_phone, c.address as customer_address
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.id = $1
    `;

    const orderResult = await pool.query(orderQuery, [id]);
    if (!orderResult.rows[0]) return null;

    const itemsQuery = `
      SELECT oi.*, p.name as product_name, p.sku as product_sku
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = $1
    `;

    const itemsResult = await pool.query(itemsQuery, [id]);

    return {
      ...orderResult.rows[0],
      items: itemsResult.rows,
    };
  }

  static async getOrderByOrderNumber(orderNumber: string): Promise<any | null> {
    const query = `
      SELECT o.*, c.company_name as customer_name
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      WHERE o.order_number = $1
    `;
    const result = await pool.query(query, [orderNumber]);
    return result.rows[0] || null;
  }

  static async updateOrder(id: number, updates: UpdateOrderDto): Promise<Order | null> {
    const {
      customer_id,
      order_date,
      delivery_date,
      status,
      subtotal,
      tax_amount,
      discount_amount,
      total_amount,
      notes,
    } = updates;

    const query = `
      UPDATE orders
      SET
        customer_id = COALESCE($1, customer_id),
        order_date = COALESCE($2, order_date),
        delivery_date = COALESCE($3, delivery_date),
        status = COALESCE($4, status),
        subtotal = COALESCE($5, subtotal),
        tax_amount = COALESCE($6, tax_amount),
        discount_amount = COALESCE($7, discount_amount),
        total_amount = COALESCE($8, total_amount),
        notes = COALESCE($9, notes)
      WHERE id = $10
      RETURNING *
    `;

    const values = [
      customer_id,
      order_date,
      delivery_date,
      status,
      subtotal,
      tax_amount,
      discount_amount,
      total_amount,
      notes,
      id,
    ];

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async updateOrderStatus(id: number, status: string): Promise<Order | null> {
    return this.updateOrder(id, { status });
  }

  static async deleteOrder(id: number): Promise<boolean> {
    const query = 'DELETE FROM orders WHERE id = $1';
    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  static async getOrdersByCustomerId(customerId: number): Promise<Order[]> {
    const query = `
      SELECT * FROM orders
      WHERE customer_id = $1
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query, [customerId]);
    return result.rows;
  }

  static async getOrderStats(): Promise<any> {
    const query = `
      SELECT
        COUNT(*) as total_orders,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN status = 'confirmed' THEN 1 END) as confirmed_orders,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
        SUM(total_amount) as total_revenue
      FROM orders
    `;

    const result = await pool.query(query);
    return result.rows[0];
  }
}
