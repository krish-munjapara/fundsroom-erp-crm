import {
  createCustomerSchema,
  updateCustomerSchema,
  createProductSchema,
  updateProductSchema,
  createInventorySchema,
  updateInventorySchema,
  stockMovementSchema,
  createOrderSchema,
  updateOrderSchema,
  updateOrderStatusSchema,
  paginationSchema,
} from '../validators/businessValidator';

describe('Customer Validators', () => {
  describe('createCustomerSchema', () => {
    test('should validate correct customer data', () => {
      const validData = {
        company_name: 'Test Company',
        contact_person: 'John Doe',
        email: 'john@testcompany.com',
        phone: '+1234567890',
        credit_limit: 10000,
      };
      
      const { error } = createCustomerSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should reject invalid email', () => {
      const invalidData = {
        company_name: 'Test Company',
        contact_person: 'John Doe',
        email: 'invalid-email',
      };
      
      const { error } = createCustomerSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    test('should reject missing required fields', () => {
      const invalidData = {
        company_name: 'Test Company',
      };
      
      const { error } = createCustomerSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    test('should reject negative credit limit', () => {
      const invalidData = {
        company_name: 'Test Company',
        contact_person: 'John Doe',
        email: 'john@testcompany.com',
        credit_limit: -100,
      };
      
      const { error } = createCustomerSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });

  describe('updateCustomerSchema', () => {
    test('should validate partial customer update', () => {
      const validData = {
        company_name: 'Updated Company',
      };
      
      const { error } = updateCustomerSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should reject invalid email in update', () => {
      const invalidData = {
        email: 'invalid-email',
      };
      
      const { error } = updateCustomerSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });
});

describe('Product Validators', () => {
  describe('createProductSchema', () => {
    test('should validate correct product data', () => {
      const validData = {
        sku: 'PROD-001',
        name: 'Test Product',
        base_price: 100,
        selling_price: 150,
      };
      
      const { error } = createProductSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should reject negative prices', () => {
      const invalidData = {
        sku: 'PROD-001',
        name: 'Test Product',
        base_price: -100,
        selling_price: 150,
      };
      
      const { error } = createProductSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    test('should reject tax rate above 100', () => {
      const invalidData = {
        sku: 'PROD-001',
        name: 'Test Product',
        base_price: 100,
        selling_price: 150,
        tax_rate: 150,
      };
      
      const { error } = createProductSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });

  describe('updateProductSchema', () => {
    test('should validate partial product update', () => {
      const validData = {
        name: 'Updated Product',
      };
      
      const { error } = updateProductSchema.validate(validData);
      expect(error).toBeUndefined();
    });
  });
});

describe('Inventory Validators', () => {
  describe('createInventorySchema', () => {
    test('should validate correct inventory data', () => {
      const validData = {
        product_id: 1,
        quantity: 100,
        location: 'Warehouse A',
      };
      
      const { error } = createInventorySchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should reject negative product_id', () => {
      const invalidData = {
        product_id: -1,
        quantity: 100,
      };
      
      const { error } = createInventorySchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    test('should reject negative quantity', () => {
      const invalidData = {
        product_id: 1,
        quantity: -100,
      };
      
      const { error } = createInventorySchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });

  describe('stockMovementSchema', () => {
    test('should validate correct stock movement', () => {
      const validData = {
        product_id: 1,
        quantity: 50,
        movement_type: 'in',
      };
      
      const { error } = stockMovementSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should reject invalid movement type', () => {
      const invalidData = {
        product_id: 1,
        quantity: 50,
        movement_type: 'invalid',
      };
      
      const { error } = stockMovementSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });
});

describe('Order Validators', () => {
  describe('createOrderSchema', () => {
    test('should validate correct order data', () => {
      const validData = {
        customer_id: 1,
        items: [
          {
            product_id: 1,
            quantity: 10,
            unit_price: 100,
            item_discount_amount: 0,
          },
        ],
      };
      
      const { error } = createOrderSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should reject empty items array', () => {
      const invalidData = {
        customer_id: 1,
        items: [],
      };
      
      const { error } = createOrderSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    test('should reject invalid order status', () => {
      const invalidData = {
        customer_id: 1,
        status: 'invalid_status',
        items: [
          {
            product_id: 1,
            quantity: 10,
            unit_price: 100,
            item_discount_amount: 0,
          },
        ],
      };
      
      const { error } = createOrderSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });

  describe('updateOrderStatusSchema', () => {
    test('should validate correct status update', () => {
      const validData = {
        status: 'confirmed',
      };
      
      const { error } = updateOrderStatusSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should reject invalid status', () => {
      const invalidData = {
        status: 'invalid_status',
      };
      
      const { error } = updateOrderStatusSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });
});

describe('Pagination Validators', () => {
  describe('paginationSchema', () => {
    test('should validate correct pagination params', () => {
      const validData = {
        page: 1,
        limit: 10,
        search: 'test',
        sort: 'created_at',
        order: 'desc',
      };
      
      const { error } = paginationSchema.validate(validData);
      expect(error).toBeUndefined();
    });

    test('should reject negative page', () => {
      const invalidData = {
        page: -1,
      };
      
      const { error } = paginationSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    test('should reject limit above 100', () => {
      const invalidData = {
        limit: 150,
      };
      
      const { error } = paginationSchema.validate(invalidData);
      expect(error).toBeDefined();
    });

    test('should reject invalid order direction', () => {
      const invalidData = {
        order: 'invalid',
      };
      
      const { error } = paginationSchema.validate(invalidData);
      expect(error).toBeDefined();
    });
  });
});
