import { CustomerService } from '../services/customerService';
import { pool } from '../config/database';

// Mock the database pool
jest.mock('../config/database');

describe('CustomerService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCustomer', () => {
    test('should create a customer successfully', async () => {
      const mockCustomer = {
        id: 1,
        company_name: 'Test Company',
        contact_person: 'John Doe',
        email: 'john@test.com',
        phone: '+1234567890',
        address: '123 Street',
        city: 'Mumbai',
        state: 'MH',
        postal_code: '400001',
        country: 'India',
        credit_limit: 10000,
        current_balance: 0,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (pool.query as jest.Mock).mockResolvedValue({
        rows: [mockCustomer],
      });

      const result = await CustomerService.createCustomer({
        company_name: 'Test Company',
        contact_person: 'John Doe',
        email: 'john@test.com',
        phone: '+1234567890',
      });

      expect(result).toEqual(mockCustomer);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO customers'),
        expect.any(Array)
      );
    });
  });

  describe('getAllCustomers', () => {
    test('should return paginated customers', async () => {
      const mockCustomers = [
        { id: 1, company_name: 'Company A', email: 'a@test.com' },
        { id: 2, company_name: 'Company B', email: 'b@test.com' },
      ];

      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '2' }] })
        .mockResolvedValueOnce({ rows: mockCustomers });

      const result = await CustomerService.getAllCustomers({ page: 1, limit: 10 });

      expect(result.data).toEqual(mockCustomers);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        pages: 1,
      });
    });

    test('should include search parameter when provided', async () => {
      (pool.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [{ count: '1' }] })
        .mockResolvedValueOnce({ rows: [] });

      await CustomerService.getAllCustomers({ search: 'test' });

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE'),
        expect.any(Array)
      );
    });
  });

  describe('getCustomerById', () => {
    test('should return customer by ID', async () => {
      const mockCustomer = {
        id: 1,
        company_name: 'Test Company',
        email: 'test@test.com',
      };

      (pool.query as jest.Mock).mockResolvedValue({
        rows: [mockCustomer],
      });

      const result = await CustomerService.getCustomerById(1);

      expect(result).toEqual(mockCustomer);
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM customers WHERE id = $1', [1]);
    });

    test('should return null when customer not found', async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [],
      });

      const result = await CustomerService.getCustomerById(999);

      expect(result).toBeNull();
    });
  });

  describe('updateCustomer', () => {
    test('should update customer successfully', async () => {
      const mockUpdatedCustomer = {
        id: 1,
        company_name: 'Updated Company',
        email: 'updated@test.com',
      };

      (pool.query as jest.Mock).mockResolvedValue({
        rows: [mockUpdatedCustomer],
      });

      const result = await CustomerService.updateCustomer(1, {
        company_name: 'Updated Company',
      });

      expect(result).toEqual(mockUpdatedCustomer);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE customers'),
        expect.any(Array)
      );
    });

    test('should return null when customer not found', async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rows: [],
      });

      const result = await CustomerService.updateCustomer(999, {
        company_name: 'Test',
      });

      expect(result).toBeNull();
    });
  });

  describe('deleteCustomer', () => {
    test('should delete customer successfully', async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rowCount: 1,
      });

      const result = await CustomerService.deleteCustomer(1);

      expect(result).toBe(true);
      expect(pool.query).toHaveBeenCalledWith('DELETE FROM customers WHERE id = $1', [1]);
    });

    test('should return false when customer not found', async () => {
      (pool.query as jest.Mock).mockResolvedValue({
        rowCount: 0,
      });

      const result = await CustomerService.deleteCustomer(999);

      expect(result).toBe(false);
    });
  });

  describe('deactivateCustomer', () => {
    test('should deactivate customer successfully', async () => {
      const mockCustomer = {
        id: 1,
        is_active: false,
      };

      (pool.query as jest.Mock).mockResolvedValue({
        rows: [mockCustomer],
      });

      const result = await CustomerService.deactivateCustomer(1);

      expect(result).toEqual(mockCustomer);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE customers'),
        expect.any(Array)
      );
    });
  });
});
