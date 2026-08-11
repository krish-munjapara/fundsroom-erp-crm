-- ============================================
-- ADD CUSTOMER TYPE, STATUS, AND FOLLOW-UP DATE
-- ============================================

-- Add customer_type column
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS customer_type VARCHAR(20) DEFAULT 'retail';

-- Add status column
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'lead';

-- Add follow_up_date column
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS follow_up_date DATE;

-- Add constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_customer_type_valid'
    ) THEN
        ALTER TABLE customers
        ADD CONSTRAINT chk_customer_type_valid
        CHECK (customer_type IN ('retail', 'wholesale', 'distributor'));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'chk_customer_status_valid'
    ) THEN
        ALTER TABLE customers
        ADD CONSTRAINT chk_customer_status_valid
        CHECK (status IN ('lead', 'active', 'inactive'));
    END IF;
END $$;

-- Update existing records
UPDATE customers
SET customer_type = 'retail'
WHERE customer_type IS NULL;

UPDATE customers
SET status = 'active'
WHERE status IS NULL;
