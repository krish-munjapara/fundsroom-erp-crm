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

export const runSeeds = async (): Promise<void> => {
  try {
    console.log('Running seeds...');
    
    const seedsDir = path.join(__dirname, '../seeds');
    
    // Check if seeds directory exists
    if (!fs.existsSync(seedsDir)) {
      console.log('No seeds directory found, skipping seeds');
      return;
    }
    
    const seedFiles = fs.readdirSync(seedsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    if (seedFiles.length === 0) {
      console.log('No seed files found, skipping seeds');
      return;
    }

    for (const file of seedFiles) {
      const filePath = path.join(seedsDir, file);
      const seedSQL = fs.readFileSync(filePath, 'utf8');
      
      console.log(`Running seed: ${file}`);
      await pool.query(seedSQL);
      console.log(`Seed ${file} completed successfully`);
    }

    console.log('All seeds completed successfully');
  } catch (error) {
    console.error('Seed failed:', error);
    throw error;
  }
};
