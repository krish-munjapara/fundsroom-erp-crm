import { pool, closeDatabaseConnection } from '../src/config/database';

async function verify() {
  const stockSync = await pool.query(`
    SELECT COUNT(*)::int AS mismatches FROM products p
    JOIN inventory i ON i.product_id = p.id
    WHERE p.current_stock != i.quantity
  `);

  const decimals = await pool.query(`
    SELECT sku, unit_price::text, base_price::text FROM products
    WHERE unit_price != TRUNC(unit_price) OR base_price != TRUNC(base_price)
    ORDER BY sku
  `);

  const lowStock = await pool.query(`
    SELECT sku, name, current_stock, minimum_stock FROM products
    WHERE current_stock <= minimum_stock ORDER BY current_stock
  `);

  const summary = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM customers) AS customers,
      (SELECT COUNT(*) FROM products) AS products,
      (SELECT COUNT(*) FROM stock_movements) AS movements,
      (SELECT COUNT(*) FROM orders) AS orders,
      (SELECT COUNT(*) FROM challans) AS challans,
      (SELECT COUNT(*) FROM customer_activities) AS activities
  `);

  console.log('Summary:', summary.rows[0]);
  console.log('Stock/inventory mismatches:', stockSync.rows[0].mismatches);
  console.log('Decimal-priced products:', decimals.rows);
  console.log('Low or out-of-stock:', lowStock.rows);

  await closeDatabaseConnection();
}

verify().catch(async (e) => {
  console.error(e);
  await closeDatabaseConnection();
  process.exit(1);
});
