/**
 * Resets transactional demo data and loads fresh realistic test dataset.
 * Preserves: schema, migrations, users (4 role accounts).
 * Usage: npx tsx scripts/reset-demo-data.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { pool, closeDatabaseConnection } from '../src/config/database';

async function countTable(table: string): Promise<number> {
  const r = await pool.query(`SELECT COUNT(*)::int AS c FROM ${table}`);
  return r.rows[0].c;
}

async function main() {
  const sqlPath = path.join(__dirname, '002_fresh_demo_data.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  console.log('Connecting to database...');
  await pool.query('SELECT 1');

  console.log('Before reset:');
  const before = {
    customers: await countTable('customers'),
    products: await countTable('products'),
    orders: await countTable('orders'),
    challans: await countTable('challans'),
    movements: await countTable('stock_movements'),
    activities: await countTable('customer_activities'),
  };
  console.log(before);

  console.log('\nRunning fresh demo data reset...');
  await pool.query(sql);

  console.log('\nAfter reset:');
  const after = {
    users: await countTable('users'),
    customers: await countTable('customers'),
    products: await countTable('products'),
    inventory: await countTable('inventory'),
    orders: await countTable('orders'),
    order_items: await countTable('order_items'),
    challans: await countTable('challans'),
    challan_items: await countTable('challan_items'),
    movements: await countTable('stock_movements'),
    activities: await countTable('customer_activities'),
  };
  console.log(after);

  const checks = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM products WHERE current_stock < 0 OR unit_price < 0 OR base_price < 0) AS bad_products,
      (SELECT COUNT(*) FROM inventory WHERE quantity < 0) AS bad_inventory,
      (SELECT COUNT(*) FROM order_items oi LEFT JOIN orders o ON oi.order_id = o.id WHERE o.id IS NULL) AS orphan_order_items,
      (SELECT COUNT(*) FROM challan_items ci LEFT JOIN challans c ON ci.challan_id = c.id WHERE c.id IS NULL) AS orphan_challan_items,
      (SELECT COUNT(*) FROM customer_activities ca LEFT JOIN customers c ON ca.customer_id = c.id WHERE c.id IS NULL) AS orphan_activities
  `);
  console.log('\nConsistency checks:', checks.rows[0]);

  const users = await pool.query(
    `SELECT email, role, is_active FROM users WHERE email LIKE '%@fundsroom.com' ORDER BY role`
  );
  console.log('\nLogin users:');
  users.rows.forEach((u) => console.log(`  ${u.email} (${u.role}) active=${u.is_active}`));

  await closeDatabaseConnection();
  console.log('\nDemo data reset complete.');
}

main().catch(async (err) => {
  console.error('Reset failed:', err);
  await closeDatabaseConnection();
  process.exit(1);
});
