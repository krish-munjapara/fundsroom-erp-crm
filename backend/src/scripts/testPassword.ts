import { pool } from '../config/database';
import { PasswordUtils } from '../utils/password';

async function testPassword() {
  try {
    const query = 'SELECT id, email, password_hash FROM users WHERE email = $1';
    const result = await pool.query(query, ['admin@fundsroom.com']);
    
    if (result.rows.length === 0) {
      console.log('[AUTH DEBUG] User NOT found: admin@fundsroom.com');
    } else {
      const user = result.rows[0];
      console.log('[AUTH DEBUG] User found:', user.email);
      
      const testPassword = 'Admin@123';
      const isValid = await PasswordUtils.comparePassword(testPassword, user.password_hash);
      
      console.log('[AUTH DEBUG] Password verification result:', isValid);
      
      if (!isValid) {
        console.log('[AUTH DEBUG] Password hash is incompatible or incorrect');
      }
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error testing password:', error);
    process.exit(1);
  }
}

testPassword();
