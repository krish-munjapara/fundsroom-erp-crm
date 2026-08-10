-- ============================================
-- CRM ACTIVITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS customer_activities (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  assigned_to INTEGER REFERENCES users(id),
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for customer activities
CREATE INDEX IF NOT EXISTS idx_customer_activities_customer_id ON customer_activities(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_activities_activity_type ON customer_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_customer_activities_status ON customer_activities(status);
CREATE INDEX IF NOT EXISTS idx_customer_activities_due_date ON customer_activities(due_date);
CREATE INDEX IF NOT EXISTS idx_customer_activities_assigned_to ON customer_activities(assigned_to);
CREATE INDEX IF NOT EXISTS idx_customer_activities_created_by ON customer_activities(created_by);

-- Trigger for updated_at
CREATE TRIGGER update_customer_activities_updated_at
  BEFORE UPDATE ON customer_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
