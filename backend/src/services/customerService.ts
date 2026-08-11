import { pool } from '../config/database';
import { Customer, CreateCustomerDto, UpdateCustomerDto, PaginationParams, PaginatedResponse } from '../types';

export class CustomerService {
  static async createCustomer(customerData: CreateCustomerDto): Promise<Customer> {
    const {
      company_name,
      contact_person,
      email,
      phone,
      address,
      city,
      state,
      postal_code,
      country = 'India',
      tax_id,
      credit_limit = 0,
      notes,
      customer_type = 'retail',
      status = 'active',
      follow_up_date,
    } = customerData;

    const query = `
      INSERT INTO customers (
        company_name, contact_person, email, phone, address, city, state,
        postal_code, country, tax_id, credit_limit, notes,
        customer_type, status, follow_up_date, is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *
    `;

    const isActive = status !== 'inactive';

    const values = [
      company_name,
      contact_person,
      email,
      phone,
      address,
      city,
      state,
      postal_code,
      country,
      tax_id,
      credit_limit,
      notes,
      customer_type,
      status,
      follow_up_date ?? null,
      isActive,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getAllCustomers(params: PaginationParams = {}): Promise<PaginatedResponse<Customer>> {
    const { page = 1, limit = 10, search = '', sort = 'created_at', order = 'desc' } = params;
    const offset = (page - 1) * limit;

    let searchQuery = '';
    let searchValues: string[] = [];
    
    if (search) {
      searchQuery = `
        WHERE company_name ILIKE $1 
        OR contact_person ILIKE $1 
        OR email ILIKE $1 
        OR phone ILIKE $1
      `;
      searchValues = [`%${search}%`];
    }

    const countQuery = `
      SELECT COUNT(*) FROM customers ${searchQuery}
    `;
    
    const countResult = await pool.query(countQuery, searchValues);
    const total = parseInt(countResult.rows[0].count);

    const allowedSort = ['created_at', 'company_name', 'contact_person', 'email'];
    const sortColumn = allowedSort.includes(sort) ? sort : 'created_at';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';

    const dataQuery = `
      SELECT * FROM customers 
      ${searchQuery}
      ORDER BY ${sortColumn} ${sortOrder}
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

  static async getCustomerById(id: number): Promise<Customer | null> {
    const query = 'SELECT * FROM customers WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async getCustomerByEmail(email: string): Promise<Customer | null> {
    const query = 'SELECT * FROM customers WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  static async updateCustomer(id: number, updates: UpdateCustomerDto): Promise<Customer | null> {
    const {
      company_name,
      contact_person,
      email,
      phone,
      address,
      city,
      state,
      postal_code,
      country,
      tax_id,
      credit_limit,
      current_balance,
      is_active,
      notes,
      customer_type,
      status,
      follow_up_date,
    } = updates;

    const query = `
      UPDATE customers
      SET 
        company_name = COALESCE($1, company_name),
        contact_person = COALESCE($2, contact_person),
        email = COALESCE($3, email),
        phone = COALESCE($4, phone),
        address = COALESCE($5, address),
        city = COALESCE($6, city),
        state = COALESCE($7, state),
        postal_code = COALESCE($8, postal_code),
        country = COALESCE($9, country),
        tax_id = COALESCE($10, tax_id),
        credit_limit = COALESCE($11, credit_limit),
        current_balance = COALESCE($12, current_balance),
        is_active = COALESCE($13, is_active),
        notes = COALESCE($14, notes),
        customer_type = COALESCE($15, customer_type),
        status = COALESCE($16, status),
        follow_up_date = COALESCE($17, follow_up_date),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $18
      RETURNING *
    `;

    const values = [
      company_name,
      contact_person,
      email,
      phone,
      address,
      city,
      state,
      postal_code,
      country,
      tax_id,
      credit_limit,
      current_balance,
      is_active,
      notes,
      customer_type,
      status,
      follow_up_date ?? null,
      id,
    ];

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async deactivateCustomer(id: number): Promise<Customer | null> {
    const query = `
      UPDATE customers
      SET is_active = false, status = 'inactive', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async deleteCustomer(id: number): Promise<boolean> {
    const query = 'DELETE FROM customers WHERE id = $1';
    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }
}
