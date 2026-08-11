import { pool } from '../config/database';
import { Product, CreateProductDto, UpdateProductDto, PaginationParams, PaginatedResponse, StockMovementDto } from '../types';
import { InventoryService } from './inventoryService';

export class ProductService {
  static async createProduct(productData: CreateProductDto, userId?: number): Promise<Product> {
    const {
      sku,
      name,
      description,
      category,
      unit_price,
      current_stock,
      minimum_stock,
      location,
      warehouse,
      is_active = true,
    } = productData;

    const query = `
      INSERT INTO products (
        sku, name, description, category, unit_price, base_price, selling_price,
        current_stock, minimum_stock, location, warehouse, is_active, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $5, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      sku,
      name,
      description,
      category,
      unit_price,
      current_stock,
      minimum_stock,
      location,
      warehouse,
      is_active,
      userId,
    ];

    const result = await pool.query(query, values);
    const product = result.rows[0];

    // Create inventory record
    if (current_stock > 0) {
      await InventoryService.createInventory({
        product_id: product.id,
        quantity: current_stock,
        location,
        warehouse,
      });

      // Create initial stock movement
      if (userId) {
        await InventoryService.recordStockMovement({
          product_id: product.id,
          quantity: current_stock,
          movement_type: 'in',
          notes: 'Initial Stock',
        }, userId);
      }
    } else {
      // Create inventory record with 0 stock
      await InventoryService.createInventory({
        product_id: product.id,
        quantity: 0,
        location,
        warehouse,
      });
    }

    return product;
  }

  static async getAllProducts(params: PaginationParams = {}): Promise<PaginatedResponse<Product>> {
    const { page = 1, limit = 10, search = '', sort = 'created_at', order = 'desc' } = params;
    const offset = (page - 1) * limit;

    let searchQuery = '';
    let searchValues: string[] = [];
    
    if (search) {
      searchQuery = `
        WHERE sku ILIKE $1 
        OR name ILIKE $1 
        OR category ILIKE $1
      `;
      searchValues = [`%${search}%`];
    }

    const countQuery = `
      SELECT COUNT(*) FROM products ${searchQuery}
    `;
    
    const countResult = await pool.query(countQuery, searchValues);
    const total = parseInt(countResult.rows[0].count);

    const dataQuery = `
      SELECT * FROM products 
      ${searchQuery}
      ORDER BY ${sort} ${order}
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

  static async getProductById(id: number): Promise<Product | null> {
    const query = 'SELECT * FROM products WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async getProductBySku(sku: string): Promise<Product | null> {
    const query = 'SELECT * FROM products WHERE sku = $1';
    const result = await pool.query(query, [sku]);
    return result.rows[0] || null;
  }

  static async updateProduct(id: number, updates: UpdateProductDto): Promise<Product | null> {
    const {
      sku,
      name,
      description,
      category,
      unit_price,
      minimum_stock,
      location,
      warehouse,
      is_active,
    } = updates;

    // Build dynamic SET clause based on provided fields
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (sku !== undefined) {
      setClauses.push(`sku = $${paramIndex++}`);
      values.push(sku);
    }
    if (name !== undefined) {
      setClauses.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (description !== undefined) {
      setClauses.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (category !== undefined) {
      setClauses.push(`category = $${paramIndex++}`);
      values.push(category);
    }
    if (unit_price !== undefined) {
      setClauses.push(`unit_price = $${paramIndex++}`);
      values.push(unit_price);
      setClauses.push(`base_price = $${paramIndex++}`);
      values.push(unit_price);
      setClauses.push(`selling_price = $${paramIndex++}`);
      values.push(unit_price);
    }
    if (minimum_stock !== undefined) {
      setClauses.push(`minimum_stock = $${paramIndex++}`);
      values.push(minimum_stock);
    }
    if (location !== undefined) {
      setClauses.push(`location = $${paramIndex++}`);
      values.push(location);
    }
    if (warehouse !== undefined) {
      setClauses.push(`warehouse = $${paramIndex++}`);
      values.push(warehouse);
    }
    if (is_active !== undefined) {
      setClauses.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE products
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async deleteProduct(id: number): Promise<boolean> {
    const query = 'DELETE FROM products WHERE id = $1';
    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  static async getActiveProducts(): Promise<Product[]> {
    const query = 'SELECT * FROM products WHERE is_active = true ORDER BY name';
    const result = await pool.query(query);
    return result.rows;
  }

  static async adjustStock(productId: number, quantity: number, movementType: 'in' | 'out', notes: string, userId: number): Promise<Product | null> {
    // Get current product
    const product = await this.getProductById(productId);
    if (!product) {
      throw new Error('Product not found');
    }

    // Validate stock for OUT movements
    if (movementType === 'out' && quantity > product.current_stock) {
      throw new Error(`Insufficient stock. Available quantity: ${product.current_stock}`);
    }

    // Calculate new stock
    const newStock = movementType === 'in' 
      ? product.current_stock + quantity 
      : product.current_stock - quantity;

    // Update product stock
    const updateQuery = `
      UPDATE products 
      SET current_stock = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING *
    `;
    const updateResult = await pool.query(updateQuery, [newStock, productId]);
    const updatedProduct = updateResult.rows[0];

    // Update inventory
    await InventoryService.updateStockQuantity(productId, movementType === 'in' ? quantity : -quantity);

    // Record stock movement
    await InventoryService.recordStockMovement({
      product_id: productId,
      quantity: Math.abs(quantity),
      movement_type: movementType,
      notes,
    }, userId);

    return updatedProduct;
  }
}
