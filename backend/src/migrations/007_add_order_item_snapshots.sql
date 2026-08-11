-- ============================================
-- ADD PRODUCT SNAPSHOT FIELDS TO ORDER ITEMS
-- ============================================

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);

ALTER TABLE order_items
ADD COLUMN IF NOT EXISTS sku VARCHAR(50);

-- Backfill existing order items from products table
UPDATE order_items oi
SET
  product_name = p.name,
  sku = p.sku
FROM products p
WHERE oi.product_id = p.id
  AND (oi.product_name IS NULL OR oi.sku IS NULL);

-- Backfill line totals where missing
UPDATE order_items
SET
  subtotal = quantity * unit_price - COALESCE(discount_amount, 0),
  total_amount = (quantity * unit_price - COALESCE(discount_amount, 0))
    * (1 + COALESCE(tax_rate, 0) / 100)
WHERE subtotal = 0 OR total_amount = 0;
