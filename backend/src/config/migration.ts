import { Pool } from 'pg';
import { pool } from './database';
import * as fs from 'fs';
import * as path from 'path';

export const runMigrations = async (): Promise<void> => {
  try {
    console.log('Running migrations...');
    
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const migrationSQL = fs.readFileSync(filePath, 'utf8');
      
      console.log(`Running migration: ${file}`);
      await pool.query(migrationSQL);
      console.log(`Migration ${file} completed successfully`);
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};
