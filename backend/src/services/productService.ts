import { pool } from '../config/database';
import { Product, CreateProductDto, UpdateProductDto, PaginationParams, PaginatedResponse } from '../types';

export class ProductService {
  static async createProduct(productData: CreateProductDto): Promise<Product> {
    const {
      sku,
      name,
      description,
      category,
      unit = 'pcs',
      base_price,
      selling_price,
      tax_rate = 0,
      hsn_code,
      reorder_level = 10,
    } = productData;

    const query = `
      INSERT INTO products (
        sku, name, description, category, unit, base_price, selling_price,
        tax_rate, hsn_code, reorder_level
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      sku,
      name,
      description,
      category,
      unit,
      base_price,
      selling_price,
      tax_rate,
      hsn_code,
      reorder_level,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
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
      unit,
      base_price,
      selling_price,
      tax_rate,
      hsn_code,
      is_active,
      reorder_level,
    } = updates;

    const query = `
      UPDATE products
      SET 
        sku = COALESCE($1, sku),
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        category = COALESCE($4, category),
        unit = COALESCE($5, unit),
        base_price = COALESCE($6, base_price),
        selling_price = COALESCE($7, selling_price),
        tax_rate = COALESCE($8, tax_rate),
        hsn_code = COALESCE($9, hsn_code),
        is_active = COALESCE($10, is_active),
        reorder_level = COALESCE($11, reorder_level)
      WHERE id = $12
      RETURNING *
    `;

    const values = [
      sku,
      name,
      description,
      category,
      unit,
      base_price,
      selling_price,
      tax_rate,
      hsn_code,
      is_active,
      reorder_level,
      id,
    ];

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
}
