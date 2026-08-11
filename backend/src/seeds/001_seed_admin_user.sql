-- Seed default users for all roles
-- This script should only run in development environments
-- Password for all users: Admin@123 (hashed with bcrypt, salt rounds: 10)

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
