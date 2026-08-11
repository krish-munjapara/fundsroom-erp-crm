import { pool } from '../config/database';

async function checkAdminUser() {
  try {
    const query = 'SELECT id, email, first_name, last_name, role, is_active FROM users WHERE email = $1';
    const result = await pool.query(query, ['admin@fundsroom.com']);
    
    if (result.rows.length === 0) {
      console.log('[AUTH DEBUG] User NOT found: admin@fundsroom.com');
    } else {
      const user = result.rows[0];
      console.log('[AUTH DEBUG] User found:');
      console.log('  - ID:', user.id);
      console.log('  - Email:', user.email);
      console.log('  - Name:', user.first_name, user.last_name);
      console.log('  - Role:', user.role);
      console.log('  - Active:', user.is_active);
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error checking admin user:', error);
    process.exit(1);
  }
}

checkAdminUser();
