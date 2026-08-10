import { pool } from '../config/database';
import { User, CreateUserDto } from '../types';

export class UserService {
  static async createUser(userData: CreateUserDto): Promise<User> {
    const { email, password, first_name, last_name, role = 'user' } = userData;
    
    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [email, password, first_name, last_name, role];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  static async getUserById(id: number): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async getAllUsers(): Promise<User[]> {
    const query = 'SELECT * FROM users ORDER BY created_at DESC';
    const result = await pool.query(query);
    return result.rows;
  }

  static async updateUser(id: number, updates: Partial<CreateUserDto>): Promise<User | null> {
    const { email, first_name, last_name, role } = updates;
    
    const query = `
      UPDATE users
      SET email = COALESCE($1, email),
          first_name = COALESCE($2, first_name),
          last_name = COALESCE($3, last_name),
          role = COALESCE($4, role)
      WHERE id = $5
      RETURNING *
    `;
    
    const values = [email, first_name, last_name, role, id];
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async deleteUser(id: number): Promise<boolean> {
    const query = 'DELETE FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  static async updateUserPassword(id: number, passwordHash: string): Promise<User | null> {
    const query = `
      UPDATE users
      SET password_hash = $1
      WHERE id = $2
      RETURNING *
    `;
    
    const result = await pool.query(query, [passwordHash, id]);
    return result.rows[0] || null;
  }
}
