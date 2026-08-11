-- ============================================
-- FRESH DEMO DATA RESET
-- Clears transactional data; preserves schema + role users.
-- Password for all users: Admin@123
-- ============================================

BEGIN;

-- --------------------------------------------
-- STEP 1: Clear transactional data (FK order)
-- --------------------------------------------
DELETE FROM challan_items;
DELETE FROM challans;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM stock_movements;
DELETE FROM inventory;
DELETE FROM customer_activities;
DELETE FROM customers;
DELETE FROM products;

-- Reset business sequences
ALTER SEQUENCE IF EXISTS customers_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS products_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS inventory_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS orders_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS order_items_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS stock_movements_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS customer_activities_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS challans_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS challan_items_id_seq RESTART WITH 1;
ALTER SEQUENCE IF EXISTS order_number_seq RESTART WITH 1;

-- --------------------------------------------
-- STEP 2: Ensure role login users exist
-- --------------------------------------------
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
VALUES
  ('admin@fundsroom.com', '$2b$10$.zwXMvEWyE.uydo7Zk4FR.s4ThDulKh44bK.J5t45o6y0vyJoPt3K', 'Admin', 'User', 'admin', true),
  ('sales@fundsroom.com', '$2b$10$.zwXMvEWyE.uydo7Zk4FR.s4ThDulKh44bK.J5t45o6y0vyJoPt3K', 'Sales', 'User', 'sales', true),
  ('warehouse@fundsroom.com', '$2b$10$.zwXMvEWyE.uydo7Zk4FR.s4ThDulKh44bK.J5t45o6y0vyJoPt3K', 'Warehouse', 'User', 'warehouse', true),
  ('accounts@fundsroom.com', '$2b$10$.zwXMvEWyE.uydo7Zk4FR.s4ThDulKh44bK.J5t45o6y0vyJoPt3K', 'Accounts', 'User', 'accounts', true)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- --------------------------------------------
-- STEP 3: Customers (5 — retail / wholesale / distributor mix)
-- --------------------------------------------
INSERT INTO customers (
  company_name, contact_person, email, phone, address, city, state, postal_code, country,
  tax_id, customer_type, status, follow_up_date, credit_limit, current_balance, is_active, notes, created_by
) VALUES
  (
    'Patel Electronics', 'Rahul Patel', 'rahul.patel@patelelectronics.in', '9876543210',
    '12 MG Road, Andheri East', 'Mumbai', 'Maharashtra', '400069', 'India',
    '27AABCP1234F1Z5', 'retail', 'active', CURRENT_DATE + INTERVAL '7 days',
    50000.00, 0.00, true, 'Regular retail buyer; prefers monthly billing.', (SELECT id FROM users WHERE email = 'sales@fundsroom.com')
  ),
  (
    'Sharma Wholesale Traders', 'Priya Sharma', 'priya@sharmawholesale.com', '9823456781',
    '45 Industrial Area, Phase 2', 'Ahmedabad', 'Gujarat', '382445', 'India',
    '24AABCS5678G1Z2', 'wholesale', 'active', CURRENT_DATE + INTERVAL '3 days',
    200000.00, 0.00, true, 'Bulk office supplies orders; negotiate on volume.', (SELECT id FROM users WHERE email = 'sales@fundsroom.com')
  ),
  (
    'Gupta Distribution Hub', 'Amit Gupta', 'amit@guptadistribution.in', '9811223344',
    '78 NH-48 Service Road', 'Gurugram', 'Haryana', '122001', 'India',
    '06AABCG9012H1Z8', 'distributor', 'active', CURRENT_DATE + INTERVAL '14 days',
    500000.00, 0.00, true, 'Pan-NCR distributor; hardware and IT focus.', (SELECT id FROM users WHERE email = 'sales@fundsroom.com')
  ),
  (
    'Mehta Retail Store', 'Kiran Mehta', 'kiran@mehtaretail.com', '9898765432',
    '3 Station Road, Navrangpura', 'Ahmedabad', 'Gujarat', '380009', 'India',
    '24AABCM3456J1Z1', 'retail', 'lead', CURRENT_DATE + INTERVAL '2 days',
    25000.00, 0.00, true, 'New lead from trade fair; follow up on first order.', (SELECT id FROM users WHERE email = 'sales@fundsroom.com')
  ),
  (
    'Singh Industrial Supplies', 'Harpreet Singh', 'harpreet@singhindustrial.com', '9876501234',
    '22 Focal Point', 'Ludhiana', 'Punjab', '141010', 'India',
    '03AABCS7890K1Z3', 'wholesale', 'active', CURRENT_DATE + INTERVAL '10 days',
    150000.00, 0.00, true, 'Industrial hardware and safety supplies.', (SELECT id FROM users WHERE email = 'sales@fundsroom.com')
  );

-- --------------------------------------------
-- STEP 4: Products (10 — varied stock levels)
-- --------------------------------------------
INSERT INTO products (
  sku, name, description, category, unit, base_price, selling_price, tax_rate,
  unit_price, current_stock, minimum_stock, location, warehouse, is_active, created_by
) VALUES
  ('FR-EL-001', 'Wireless Mouse', 'Ergonomic 2.4GHz wireless mouse', 'Electronics', 'pcs', 550.00, 550.00, 18.00, 550.00, 110, 20, 'Aisle A1', 'Mumbai Main Warehouse', true, (SELECT id FROM users WHERE email = 'warehouse@fundsroom.com')),
  ('FR-EL-002', 'USB-C Hub 7-in-1', '7-port USB-C hub with HDMI', 'Electronics', 'pcs', 1250.50, 1250.50, 18.00, 1250.50, 82, 15, 'Aisle A2', 'Mumbai Main Warehouse', true, (SELECT id FROM users WHERE email = 'warehouse@fundsroom.com')),
  ('FR-OF-001', 'A4 Paper Ream', '500 sheets 80 GSM A4 paper', 'Office Supplies', 'ream', 320.00, 320.00, 12.00, 320.00, 200, 50, 'Aisle B1', 'Mumbai Main Warehouse', true, (SELECT id FROM users WHERE email = 'warehouse@fundsroom.com')),
  ('FR-OF-002', 'Ballpoint Pen Box', 'Box of 50 blue ballpoint pens', 'Office Supplies', 'box', 185.75, 185.75, 12.00, 185.75, 8, 25, 'Aisle B2', 'Mumbai Main Warehouse', true, (SELECT id FROM users WHERE email = 'warehouse@fundsroom.com')),
  ('FR-HW-001', 'Steel Shelving Unit', '5-tier industrial steel shelf', 'Hardware', 'unit', 4500.00, 4500.00, 18.00, 4500.00, 40, 10, 'Zone C1', 'Gurugram Warehouse', true, (SELECT id FROM users WHERE email = 'warehouse@fundsroom.com')),
  ('FR-HW-002', 'Industrial Gloves Pack', 'Pack of 12 safety gloves', 'Hardware', 'pack', 675.50, 675.50, 18.00, 675.50, 0, 30, 'Zone C2', 'Gurugram Warehouse', true, (SELECT id FROM users WHERE email = 'warehouse@fundsroom.com')),
  ('FR-IT-001', 'Ethernet Cable 5m', 'Cat6 ethernet cable 5 metre', 'IT Accessories', 'pcs', 425.50, 425.50, 18.00, 425.50, 15, 20, 'Aisle D1', 'Mumbai Main Warehouse', true, (SELECT id FROM users WHERE email = 'warehouse@fundsroom.com')),
  ('FR-IT-002', 'HDMI Adapter', 'USB-C to HDMI 4K adapter', 'IT Accessories', 'pcs', 890.00, 890.00, 18.00, 890.00, 50, 10, 'Aisle D2', 'Mumbai Main Warehouse', true, (SELECT id FROM users WHERE email = 'warehouse@fundsroom.com')),
  ('FR-CL-001', 'Office Cleaning Kit', 'Multi-surface cleaning kit', 'Cleaning Supplies', 'kit', 1250.75, 1250.75, 12.00, 1250.75, 35, 15, 'Aisle E1', 'Mumbai Main Warehouse', true, (SELECT id FROM users WHERE email = 'warehouse@fundsroom.com')),
  ('FR-CL-002', 'Hand Sanitizer 500ml', 'Alcohol-based hand sanitizer', 'Cleaning Supplies', 'bottle', 275.00, 275.00, 12.00, 275.00, 150, 40, 'Aisle E2', 'Mumbai Main Warehouse', true, (SELECT id FROM users WHERE email = 'warehouse@fundsroom.com'));

-- --------------------------------------------
-- STEP 5: Inventory (synced with product stock)
-- --------------------------------------------
INSERT INTO inventory (product_id, quantity, reserved_quantity, location, warehouse)
SELECT id, current_stock, 0, location, warehouse FROM products;

-- --------------------------------------------
-- STEP 6: Stock movements (IN history + OUT for confirmed transactions)
-- --------------------------------------------
INSERT INTO stock_movements (product_id, movement_type, quantity, reference_type, reference_id, notes, created_by)
SELECT p.id, 'in',
  CASE p.sku
    WHEN 'FR-EL-001' THEN 120
    WHEN 'FR-EL-002' THEN 85
    WHEN 'FR-OF-001' THEN 200
    WHEN 'FR-OF-002' THEN 33
    WHEN 'FR-HW-001' THEN 45
    WHEN 'FR-HW-002' THEN 30
    WHEN 'FR-IT-001' THEN 18
    WHEN 'FR-IT-002' THEN 60
    WHEN 'FR-CL-001' THEN 35
    WHEN 'FR-CL-002' THEN 150
  END,
  'opening', NULL, 'Initial stock receipt', (SELECT id FROM users WHERE email = 'warehouse@fundsroom.com')
FROM products p;

-- Prior OUT movements explaining low/out-of-stock items
INSERT INTO stock_movements (product_id, movement_type, quantity, reference_type, notes, created_by)
SELECT id, 'out', 25, 'adjustment', 'Prior dispatch — pens', (SELECT id FROM users WHERE email = 'warehouse@fundsroom.com') FROM products WHERE sku = 'FR-OF-002';
INSERT INTO stock_movements (product_id, movement_type, quantity, reference_type, notes, created_by)
SELECT id, 'out', 30, 'adjustment', 'Prior dispatch — gloves sold out', (SELECT id FROM users WHERE email = 'warehouse@fundsroom.com') FROM products WHERE sku = 'FR-HW-002';
INSERT INTO stock_movements (product_id, movement_type, quantity, reference_type, notes, created_by)
SELECT id, 'out', 3, 'adjustment', 'Prior dispatch — cables', (SELECT id FROM users WHERE email = 'warehouse@fundsroom.com') FROM products WHERE sku = 'FR-IT-001';

-- --------------------------------------------
-- STEP 7: Orders — 1 pending, 1 confirmed
-- --------------------------------------------
INSERT INTO orders (
  order_number, customer_id, order_date, status, subtotal, tax_amount, discount_amount, total_amount, notes, created_by
) VALUES (
  'ORD-20260812-0001',
  (SELECT id FROM customers WHERE email = 'kiran@mehtaretail.com'),
  CURRENT_DATE,
  'pending',
  2029.25, 0.00, 0.00, 2029.25,
  'Pending first order — awaiting confirmation.',
  (SELECT id FROM users WHERE email = 'sales@fundsroom.com')
);

INSERT INTO order_items (order_id, product_id, product_name, sku, quantity, unit_price, tax_rate, discount_amount, subtotal, total_amount)
VALUES
  (
    (SELECT id FROM orders WHERE order_number = 'ORD-20260812-0001'),
    (SELECT id FROM products WHERE sku = 'FR-OF-002'),
    'Ballpoint Pen Box', 'FR-OF-002', 5, 185.75, 12.00, 0.00, 928.75, 928.75
  ),
  (
    (SELECT id FROM orders WHERE order_number = 'ORD-20260812-0001'),
    (SELECT id FROM products WHERE sku = 'FR-EL-001'),
    'Wireless Mouse', 'FR-EL-001', 2, 550.00, 18.00, 0.00, 1100.00, 1100.00
  );

INSERT INTO orders (
  order_number, customer_id, order_date, status, subtotal, tax_amount, discount_amount, total_amount, notes, created_by
) VALUES (
  'ORD-20260812-0002',
  (SELECT id FROM customers WHERE email = 'rahul.patel@patelelectronics.in'),
  CURRENT_DATE - INTERVAL '2 days',
  'confirmed',
  9251.50, 0.00, 0.00, 9251.50,
  'Confirmed order — stock deducted.',
  (SELECT id FROM users WHERE email = 'sales@fundsroom.com')
);

INSERT INTO order_items (order_id, product_id, product_name, sku, quantity, unit_price, tax_rate, discount_amount, subtotal, total_amount)
VALUES
  (
    (SELECT id FROM orders WHERE order_number = 'ORD-20260812-0002'),
    (SELECT id FROM products WHERE sku = 'FR-EL-001'),
    'Wireless Mouse', 'FR-EL-001', 10, 550.00, 18.00, 0.00, 5500.00, 5500.00
  ),
  (
    (SELECT id FROM orders WHERE order_number = 'ORD-20260812-0002'),
    (SELECT id FROM products WHERE sku = 'FR-EL-002'),
    'USB-C Hub 7-in-1', 'FR-EL-002', 3, 1250.50, 18.00, 0.00, 3751.50, 3751.50
  );

-- Stock OUT for confirmed order ORD-20260812-0002
INSERT INTO stock_movements (product_id, movement_type, quantity, reference_type, reference_id, notes, created_by)
SELECT p.id, 'out', 10, 'order', o.id, 'Order ORD-20260812-0002 confirmed', (SELECT id FROM users WHERE email = 'sales@fundsroom.com')
FROM products p, orders o WHERE p.sku = 'FR-EL-001' AND o.order_number = 'ORD-20260812-0002';

INSERT INTO stock_movements (product_id, movement_type, quantity, reference_type, reference_id, notes, created_by)
SELECT p.id, 'out', 3, 'order', o.id, 'Order ORD-20260812-0002 confirmed', (SELECT id FROM users WHERE email = 'sales@fundsroom.com')
FROM products p, orders o WHERE p.sku = 'FR-EL-002' AND o.order_number = 'ORD-20260812-0002';

-- --------------------------------------------
-- STEP 8: Challans — 1 draft, 1 confirmed
-- --------------------------------------------
INSERT INTO challans (
  challan_number, customer_id, status, total_items, total_quantity, total_amount, notes, created_by, confirmed_at
) VALUES (
  'CH-20260812-0001',
  (SELECT id FROM customers WHERE email = 'priya@sharmawholesale.com'),
  'draft', 1, 20, 6400.00,
  'Draft challan — A4 paper dispatch pending confirmation.',
  (SELECT id FROM users WHERE email = 'sales@fundsroom.com'),
  NULL
);

INSERT INTO challan_items (challan_id, product_id, product_name, sku, unit_price, quantity, total)
VALUES (
  (SELECT id FROM challans WHERE challan_number = 'CH-20260812-0001'),
  (SELECT id FROM products WHERE sku = 'FR-OF-001'),
  'A4 Paper Ream', 'FR-OF-001', 320.00, 20, 6400.00
);

INSERT INTO challans (
  challan_number, customer_id, status, total_items, total_quantity, total_amount, notes, created_by, confirmed_at
) VALUES (
  'CH-20260812-0002',
  (SELECT id FROM customers WHERE email = 'amit@guptadistribution.in'),
  'confirmed', 2, 15, 31400.00,
  'Confirmed challan — hardware dispatch completed.',
  (SELECT id FROM users WHERE email = 'sales@fundsroom.com'),
  CURRENT_TIMESTAMP - INTERVAL '1 day'
);

INSERT INTO challan_items (challan_id, product_id, product_name, sku, unit_price, quantity, total)
VALUES
  (
    (SELECT id FROM challans WHERE challan_number = 'CH-20260812-0002'),
    (SELECT id FROM products WHERE sku = 'FR-HW-001'),
    'Steel Shelving Unit', 'FR-HW-001', 4500.00, 5, 22500.00
  ),
  (
    (SELECT id FROM challans WHERE challan_number = 'CH-20260812-0002'),
    (SELECT id FROM products WHERE sku = 'FR-IT-002'),
    'HDMI Adapter', 'FR-IT-002', 890.00, 10, 8900.00
  );

-- Stock OUT for confirmed challan CH-20260812-0002
INSERT INTO stock_movements (product_id, movement_type, quantity, reference_type, reference_id, notes, created_by)
SELECT p.id, 'out', 5, 'challan', c.id, 'Challan CH-20260812-0002 confirmed', (SELECT id FROM users WHERE email = 'sales@fundsroom.com')
FROM products p, challans c WHERE p.sku = 'FR-HW-001' AND c.challan_number = 'CH-20260812-0002';

INSERT INTO stock_movements (product_id, movement_type, quantity, reference_type, reference_id, notes, created_by)
SELECT p.id, 'out', 10, 'challan', c.id, 'Challan CH-20260812-0002 confirmed', (SELECT id FROM users WHERE email = 'sales@fundsroom.com')
FROM products p, challans c WHERE p.sku = 'FR-IT-002' AND c.challan_number = 'CH-20260812-0002';

-- --------------------------------------------
-- STEP 9: CRM follow-up activities
-- --------------------------------------------
INSERT INTO customer_activities (
  customer_id, activity_type, subject, description, status, due_date, assigned_to, created_by
) VALUES
  (
    (SELECT id FROM customers WHERE email = 'kiran@mehtaretail.com'),
    'call', 'Follow up on first order quote', 'Call Kiran to confirm pending order ORD-20260812-0001.', 'pending',
    CURRENT_TIMESTAMP + INTERVAL '2 days', (SELECT id FROM users WHERE email = 'sales@fundsroom.com'), (SELECT id FROM users WHERE email = 'sales@fundsroom.com')
  ),
  (
    (SELECT id FROM customers WHERE email = 'priya@sharmawholesale.com'),
    'meeting', 'Review draft challan CH-20260812-0001', 'Confirm paper ream quantities before dispatch.', 'pending',
    CURRENT_TIMESTAMP + INTERVAL '3 days', (SELECT id FROM users WHERE email = 'sales@fundsroom.com'), (SELECT id FROM users WHERE email = 'sales@fundsroom.com')
  ),
  (
    (SELECT id FROM customers WHERE email = 'amit@guptadistribution.in'),
    'email', 'Thank you for confirmed challan', 'Sent delivery confirmation for CH-20260812-0002.', 'completed',
    CURRENT_TIMESTAMP - INTERVAL '1 day', (SELECT id FROM users WHERE email = 'sales@fundsroom.com'), (SELECT id FROM users WHERE email = 'sales@fundsroom.com')
  ),
  (
    (SELECT id FROM customers WHERE email = 'harpreet@singhindustrial.com'),
    'call', 'Restock industrial gloves', 'Discuss reorder for FR-HW-002 — currently out of stock.', 'pending',
    CURRENT_TIMESTAMP + INTERVAL '5 days', (SELECT id FROM users WHERE email = 'sales@fundsroom.com'), (SELECT id FROM users WHERE email = 'sales@fundsroom.com')
  ),
  (
    (SELECT id FROM customers WHERE email = 'rahul.patel@patelelectronics.in'),
    'note', 'Confirmed order delivered', 'Order ORD-20260812-0002 fulfilled successfully.', 'completed',
    CURRENT_TIMESTAMP - INTERVAL '1 day', (SELECT id FROM users WHERE email = 'sales@fundsroom.com'), (SELECT id FROM users WHERE email = 'sales@fundsroom.com')
  );

COMMIT;
