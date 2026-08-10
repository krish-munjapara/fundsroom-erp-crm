import { testDatabaseConnection, pool } from '../config/database';

describe('Database Connection', () => {
  beforeAll(async () => {
    // Skip tests if DATABASE_URL is not set
    if (!process.env.DATABASE_URL) {
      console.log('DATABASE_URL not set, skipping database tests');
    }
  });

  test('should connect to database successfully', async () => {
    if (!process.env.DATABASE_URL) {
      return;
    }

    const isConnected = await testDatabaseConnection();
    expect(isConnected).toBe(true);
  });

  test('should execute a simple query', async () => {
    if (!process.env.DATABASE_URL) {
      return;
    }

    const result = await pool.query('SELECT NOW()');
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toHaveProperty('now');
  });

  afterAll(async () => {
    if (process.env.DATABASE_URL) {
      await pool.end();
    }
  });
});
