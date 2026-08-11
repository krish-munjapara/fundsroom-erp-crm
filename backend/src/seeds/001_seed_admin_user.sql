-- Seed default admin user
-- This script should only run in development environments
-- Password: Admin@123 (hashed with bcrypt, salt rounds: 10)

INSERT INTO users (email, password_hash, first_name, last_name, role, is_active)
VALUES (
  'admin@fundsroom.com',
  '$2b$10$.zwXMvEWyE.uydo7Zk4FR.s4ThDulKh44bK.J5t45o6y0vyJoPt3K',
  'Admin',
  'User',
  'admin',
  true
)
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;
