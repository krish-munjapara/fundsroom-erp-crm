import { pool } from '../config/database';
import {
  CustomerActivity,
  CreateCustomerActivityDto,
  UpdateCustomerActivityDto,
  PaginationParams,
  PaginatedResponse,
} from '../types';

export class CustomerActivityService {
  static async createActivity(activityData: CreateCustomerActivityDto): Promise<CustomerActivity> {
    const {
      customer_id,
      activity_type,
      subject,
      description,
      status = 'pending',
      due_date,
      assigned_to,
      created_by,
    } = activityData;

    const query = `
      INSERT INTO customer_activities (
        customer_id, activity_type, subject, description, status, due_date, assigned_to, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      customer_id,
      activity_type,
      subject,
      description,
      status,
      due_date,
      assigned_to,
      created_by,
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getAllActivities(params: PaginationParams = {}): Promise<PaginatedResponse<CustomerActivity>> {
    const { page = 1, limit = 10, search = '', sort = 'created_at', order = 'desc' } = params;
    const offset = (page - 1) * limit;

    let searchQuery = '';
    let searchValues: string[] = [];

    if (search) {
      searchQuery = `
        WHERE ca.subject ILIKE $1
        OR ca.activity_type ILIKE $1
        OR c.company_name ILIKE $1
      `;
      searchValues = [`%${search}%`];
    }

    const countQuery = `
      SELECT COUNT(*) FROM customer_activities ca
      JOIN customers c ON ca.customer_id = c.id
      ${searchQuery}
    `;

    const countResult = await pool.query(countQuery, searchValues);
    const total = parseInt(countResult.rows[0].count);

    const dataQuery = `
      SELECT ca.*, c.company_name as customer_name
      FROM customer_activities ca
      JOIN customers c ON ca.customer_id = c.id
      ${searchQuery}
      ORDER BY ca.${sort} ${order}
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

  static async getActivityById(id: number): Promise<CustomerActivity | null> {
    const query = `
      SELECT ca.*, c.company_name as customer_name
      FROM customer_activities ca
      JOIN customers c ON ca.customer_id = c.id
      WHERE ca.id = $1
    `;
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async getActivitiesByCustomerId(customerId: number): Promise<CustomerActivity[]> {
    const query = `
      SELECT ca.*, c.company_name as customer_name
      FROM customer_activities ca
      JOIN customers c ON ca.customer_id = c.id
      WHERE ca.customer_id = $1
      ORDER BY ca.created_at DESC
    `;
    const result = await pool.query(query, [customerId]);
    return result.rows;
  }

  static async updateActivity(activityData: UpdateCustomerActivityDto): Promise<CustomerActivity | null> {
    const {
      activity_type,
      subject,
      description,
      status,
      due_date,
      completed_at,
      assigned_to,
      updated_by,
    } = activityData;

    const query = `
      UPDATE customer_activities
      SET
        activity_type = COALESCE($1, activity_type),
        subject = COALESCE($2, subject),
        description = COALESCE($3, description),
        status = COALESCE($4, status),
        due_date = COALESCE($5, due_date),
        completed_at = COALESCE($6, completed_at),
        assigned_to = COALESCE($7, assigned_to),
        updated_by = COALESCE($8, updated_by)
      WHERE id = $9
      RETURNING *
    `;

    const values = [
      activity_type,
      subject,
      description,
      status,
      due_date,
      completed_at,
      assigned_to,
      updated_by,
      activityData.id,
    ];

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async deleteActivity(id: number): Promise<boolean> {
    const query = 'DELETE FROM customer_activities WHERE id = $1';
    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  static async getActivityTimeline(customerId: number): Promise<CustomerActivity[]> {
    const query = `
      SELECT
        ca.*,
        c.company_name as customer_name,
        u.email as assigned_to_email
      FROM customer_activities ca
      JOIN customers c ON ca.customer_id = c.id
      LEFT JOIN users u ON ca.assigned_to = u.id
      WHERE ca.customer_id = $1
      ORDER BY ca.created_at DESC
    `;
    const result = await pool.query(query, [customerId]);
    return result.rows;
  }
}
