import { PasswordUtils } from '../utils/password';
import { JwtUtils } from '../utils/jwt';
import { registerSchema, loginSchema } from '../validators/authValidator';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    test('should hash a password successfully', async () => {
      const password = 'Test@123';
      const hash = await PasswordUtils.hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    test('should generate different hashes for same password', async () => {
      const password = 'Test@123';
      const hash1 = await PasswordUtils.hashPassword(password);
      const hash2 = await PasswordUtils.hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    test('should return true for correct password', async () => {
      const password = 'Test@123';
      const hash = await PasswordUtils.hashPassword(password);
      
      const isValid = await PasswordUtils.comparePassword(password, hash);
      expect(isValid).toBe(true);
    });

    test('should return false for incorrect password', async () => {
      const password = 'Test@123';
      const wrongPassword = 'Wrong@123';
      const hash = await PasswordUtils.hashPassword(password);
      
      const isValid = await PasswordUtils.comparePassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    test('should return true for strong password', () => {
      const strongPassword = 'Strong@123';
      const isValid = PasswordUtils.validatePasswordStrength(strongPassword);
      expect(isValid).toBe(true);
    });

    test('should return false for weak password - no uppercase', () => {
      const weakPassword = 'weak@123';
      const isValid = PasswordUtils.validatePasswordStrength(weakPassword);
      expect(isValid).toBe(false);
    });

    test('should return false for weak password - no lowercase', () => {
      const weakPassword = 'WEAK@123';
      const isValid = PasswordUtils.validatePasswordStrength(weakPassword);
      expect(isValid).toBe(false);
    });

    test('should return false for weak password - no number', () => {
      const weakPassword = 'Weak@Password';
      const isValid = PasswordUtils.validatePasswordStrength(weakPassword);
      expect(isValid).toBe(false);
    });

    test('should return false for weak password - no special character', () => {
      const weakPassword = 'WeakPassword123';
      const isValid = PasswordUtils.validatePasswordStrength(weakPassword);
      expect(isValid).toBe(false);
    });

    test('should return false for short password', () => {
      const shortPassword = 'Ww1@';
      const isValid = PasswordUtils.validatePasswordStrength(shortPassword);
      expect(isValid).toBe(false);
    });
  });
});

describe('JWT Utilities', () => {
  const mockPayload = {
    userId: 1,
    email: 'test@example.com',
    role: 'user',
  };

  describe('generateToken', () => {
    test('should generate a valid JWT token', () => {
      const token = JwtUtils.generateToken(mockPayload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('verifyToken', () => {
    test('should verify a valid token', () => {
      const token = JwtUtils.generateToken(mockPayload);
      const decoded = JwtUtils.verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(mockPayload.userId);
      expect(decoded?.email).toBe(mockPayload.email);
      expect(decoded?.role).toBe(mockPayload.role);
    });

    test('should return null for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      const decoded = JwtUtils.verifyToken(invalidToken);
      
      expect(decoded).toBeNull();
    });
  });

  describe('decodeToken', () => {
    test('should decode a token without verification', () => {
      const token = JwtUtils.generateToken(mockPayload);
      const decoded = JwtUtils.decodeToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(mockPayload.userId);
    });
  });
});

describe('Validation Schemas', () => {
  describe('registerSchema', () => {
    test('should validate correct registration data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Test@123',
        first_name: 'John',
        last_name: 'Doe',
      };
      
      const { error } = registerSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'Test@123',
        first_name: 'John',
        last_name: 'Doe',
      };
      
      const { error } = registerSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    test('should reject weak password', () => {
      const invalidData = {
        email: 'test@example.com',
        password: 'weak',
        first_name: 'John',
        last_name: 'Doe',
      };
      
      const { error } = registerSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    test('should reject missing required fields', () => {
      const invalidData = {
        email: 'test@example.com',
      };
      
      const { error } = registerSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });

  describe('loginSchema', () => {
    test('should validate correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'Test@123',
      };
      
      const { error } = loginSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should reject invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'Test@123',
      };
      
      const { error } = loginSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    test('should reject missing password', () => {
      const invalidData = {
        email: 'test@example.com',
      };
      
      const { error } = loginSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });
});
