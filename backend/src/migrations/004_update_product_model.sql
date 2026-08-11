-- ============================================
-- UPDATE PRODUCT MODEL FOR CASE STUDY
-- ============================================

-- Add unit_price column
ALTER TABLE products
ADD COLUMN IF NOT EXISTS unit_price DECIMAL(15, 2);

-- Add location column
ALTER TABLE products
ADD COLUMN IF NOT EXISTS location VARCHAR(100);

-- Add warehouse column
ALTER TABLE products
ADD COLUMN IF NOT EXISTS warehouse VARCHAR(100);

-- Add current_stock column
ALTER TABLE products
ADD COLUMN IF NOT EXISTS current_stock INTEGER DEFAULT 0;

-- Migrate base_price to unit_price
UPDATE products
SET unit_price = base_price
WHERE unit_price IS NULL;

-- Set remaining NULL unit_price to 0
UPDATE products
SET unit_price = 0
WHERE unit_price IS NULL;

-- Set default location
UPDATE products
SET location = 'Main Warehouse'
WHERE location IS NULL;

-- Set default warehouse
UPDATE products
SET warehouse = 'Main Warehouse'
WHERE warehouse IS NULL;

-- Sync current_stock from inventory
UPDATE products p
SET current_stock = COALESCE(i.quantity, 0)
FROM inventory i
WHERE i.product_id = p.id;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_products_location
ON products(location);

CREATE INDEX IF NOT EXISTS idx_products_warehouse
ON products(warehouse);

CREATE INDEX IF NOT EXISTS idx_products_current_stock
ON products(current_stock);

-- ============================================
-- CONSTRAINTS
-- Make them idempotent
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_unit_price_non_negative'
    ) THEN
        ALTER TABLE products
        ADD CONSTRAINT chk_unit_price_non_negative
        CHECK (unit_price >= 0);
    END IF;
END $$;


DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_current_stock_non_negative'
    ) THEN
        ALTER TABLE products
        ADD CONSTRAINT chk_current_stock_non_negative
        CHECK (current_stock >= 0);
    END IF;
END $$;

-- ============================================
-- STOCK MOVEMENTS
-- ============================================

-- Convert old adjustment movements to IN
UPDATE stock_movements
SET movement_type = 'in'
WHERE movement_type = 'adjustment';

-- Add movement type constraint only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_movement_type_valid'
    ) THEN
        ALTER TABLE stock_movements
        ADD CONSTRAINT chk_movement_type_valid
        CHECK (movement_type IN ('in', 'out'));
    END IF;
END $$;

-- ============================================
-- CREATED BY
-- ============================================

-- Fill existing NULL values first
UPDATE stock_movements
SET created_by = 1
WHERE created_by IS NULL;

-- Set default and NOT NULL only if not already set
DO $$
BEGIN
    -- Check if column has a default
    IF NOT EXISTS (
        SELECT 1
        FROM pg_attrdef
        JOIN pg_attribute ON pg_attrdef.adnum = pg_attribute.attnum
        JOIN pg_class ON pg_attribute.attrelid = pg_class.oid
        WHERE pg_class.relname = 'stock_movements'
        AND pg_attribute.attname = 'created_by'
        AND pg_attrdef.adsrc = '1'
    ) THEN
        ALTER TABLE stock_movements
        ALTER COLUMN created_by SET DEFAULT 1;
    END IF;
    
    -- Check if column is NOT NULL
    IF EXISTS (
        SELECT 1
        FROM pg_attribute
        JOIN pg_class ON pg_attribute.attrelid = pg_class.oid
        WHERE pg_class.relname = 'stock_movements'
        AND pg_attribute.attname = 'created_by'
        AND pg_attribute.attnotnull = false
    ) THEN
        ALTER TABLE stock_movements
        ALTER COLUMN created_by SET NOT NULL;
    END IF;
END $$;

-- ============================================
-- NOTES
-- ============================================

-- Fill existing NULL values first
UPDATE stock_movements
SET notes = 'Stock adjustment'
WHERE notes IS NULL;

-- Set default and NOT NULL only if not already set
DO $$
BEGIN
    -- Check if column has a default
    IF NOT EXISTS (
        SELECT 1
        FROM pg_attrdef
        JOIN pg_attribute ON pg_attrdef.adnum = pg_attribute.attnum
        JOIN pg_class ON pg_attribute.attrelid = pg_class.oid
        WHERE pg_class.relname = 'stock_movements'
        AND pg_attribute.attname = 'notes'
        AND pg_attrdef.adsrc = '''Stock adjustment'''
    ) THEN
        ALTER TABLE stock_movements
        ALTER COLUMN notes SET DEFAULT 'Stock adjustment';
    END IF;
    
    -- Check if column is NOT NULL
    IF EXISTS (
        SELECT 1
        FROM pg_attribute
        JOIN pg_class ON pg_attribute.attrelid = pg_class.oid
        WHERE pg_class.relname = 'stock_movements'
        AND pg_attribute.attname = 'notes'
        AND pg_attribute.attnotnull = false
    ) THEN
        ALTER TABLE stock_movements
        ALTER COLUMN notes SET NOT NULL;
    END IF;
END $$;