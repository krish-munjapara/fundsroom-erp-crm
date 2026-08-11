-- ============================================
-- CREATE SALES CHALLAN TABLES
-- ============================================

-- Challans table
CREATE TABLE IF NOT EXISTS challans (
    id SERIAL PRIMARY KEY,
    challan_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'cancelled')),
    total_items INTEGER DEFAULT 0,
    total_quantity INTEGER DEFAULT 0,
    total_amount DECIMAL(15, 2) DEFAULT 0,
    notes TEXT,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_at TIMESTAMP,
    cancelled_at TIMESTAMP
);

-- Challan items table (stores product snapshot)
CREATE TABLE IF NOT EXISTS challan_items (
    id SERIAL PRIMARY KEY,
    challan_id INTEGER NOT NULL REFERENCES challans(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    total DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_challans_customer ON challans(customer_id);
CREATE INDEX IF NOT EXISTS idx_challans_status ON challans(status);
CREATE INDEX IF NOT EXISTS idx_challans_created_at ON challans(created_at);
CREATE INDEX IF NOT EXISTS idx_challans_challan_number ON challans(challan_number);
CREATE INDEX IF NOT EXISTS idx_challan_items_challan ON challan_items(challan_id);
CREATE INDEX IF NOT EXISTS idx_challan_items_product ON challan_items(product_id);

-- ============================================
-- CONSTRAINTS
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_challan_quantity_positive'
    ) THEN
        ALTER TABLE challans
        ADD CONSTRAINT chk_challan_quantity_positive
        CHECK (total_quantity >= 0);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_challan_amount_positive'
    ) THEN
        ALTER TABLE challans
        ADD CONSTRAINT chk_challan_amount_positive
        CHECK (total_amount >= 0);
    END IF;
END $$;

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_challan_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_challan_updated_at ON challans;
CREATE TRIGGER trigger_update_challan_updated_at
    BEFORE UPDATE ON challans
    FOR EACH ROW
    EXECUTE FUNCTION update_challan_updated_at();
