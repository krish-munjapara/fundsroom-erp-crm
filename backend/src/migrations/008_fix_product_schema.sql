-- ============================================
-- FIX PRODUCT SCHEMA FOR APPLICATION ALIGNMENT
-- ============================================

ALTER TABLE products
ADD COLUMN IF NOT EXISTS minimum_stock INTEGER DEFAULT 10;

-- Sync minimum_stock from reorder_level where missing
UPDATE products
SET minimum_stock = COALESCE(reorder_level, 10)
WHERE minimum_stock IS NULL;

-- Ensure unit_price feeds legacy price columns
UPDATE products
SET
  base_price = COALESCE(base_price, unit_price, 0),
  selling_price = COALESCE(selling_price, unit_price, 0)
WHERE base_price IS NULL OR selling_price IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_minimum_stock ON products(minimum_stock);
