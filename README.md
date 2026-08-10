# Fundsroom ERP CRM

A Mini ERP + CRM Operations Portal for wholesale/distribution companies, built for Fundsroom Infotech Pvt. Ltd.

## Project Overview

This is a full-stack web application designed to manage business operations for wholesale and distribution companies. The system will handle customer relationships, inventory management, sales tracking, and operational workflows.

**Important:** This project is being implemented in controlled phases. Phase 3 is currently complete, which includes core business modules for customer management, product management, inventory management, and order management.

## Technology Stack

### Frontend
- **React** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Responsive Design** - Mobile-first approach

### Backend
- **Node.js** - JavaScript runtime
- **TypeScript** - Type-safe JavaScript
- **Express.js** - Web framework
- **REST APIs** - API architecture

### Database
- **PostgreSQL** - Primary database
- **Neon PostgreSQL** - Production database (to be configured)

### Authentication
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing
- **Joi** - Request validation

### Development Tools
- **Git** - Version control
- **GitHub** - Code hosting
- **Environment Variables** - Configuration management

## Current Implementation Status

### ✅ Phase 1 - Project Foundation (Complete)
- Project structure initialization
- Backend setup with Express.js and TypeScript
- Frontend setup with React, Vite, and Tailwind CSS
- Health endpoint implementation
- Environment variable configuration
- TypeScript compilation setup
- Development and production scripts

### ✅ Phase 2 - Database & Authentication (Complete)
- PostgreSQL database schema design and implementation
- Database connection configuration with connection pooling
- Database migration system for users table
- User model and service layer
- Password hashing with bcrypt
- JWT token generation and verification
- User registration API with validation
- User login API with authentication
- Protected routes with authentication middleware
- Role-based authorization (admin, manager, user)
- Request validation with Joi
- Comprehensive test suite for authentication
- Graceful database connection handling

### ✅ Phase 3 - Core Business Modules (Complete)
- **Customer Management (CRM)**
  - Customer database schema with company info, contact details, credit limits
  - CRUD APIs for customer operations
  - Search and filter functionality
  - Customer status management (active/inactive)
  - Frontend customer list and management interface
  - Customer creation and editing forms
- **Product/Service Management**
  - Product database schema with SKU, pricing, categories
  - CRUD APIs for product operations
  - Product status and category management
  - Tax rate and HSN code support
  - Frontend product management interface
  - Product creation and editing forms
- **Inventory Management**
  - Inventory database schema with stock tracking
  - Stock quantity and status management
  - Stock increase/decrease operations
  - Low-stock detection and alerts
  - Stock movement tracking
  - Frontend inventory dashboard
- **Sales/Order Foundation**
  - Order database schema with customer linking
  - Order items with product associations
  - Order status management (pending, confirmed, processing, shipped, delivered, cancelled)
  - Order totals calculation (subtotal, tax, discount)
  - Frontend order management interface
  - Order statistics and reporting

### 🔄 Future Phases (Not Yet Implemented)
- Sales challan generation
- Advanced dashboard and analytics
- PDF generation for documents
- Payment processing integration
- Advanced reporting features
- Deployment configuration

## Project Structure

```
fundsroom-erp-crm/
├── frontend/
│   ├── src/
│   │   ├── components/      # React components (future)
│   │   ├── pages/           # Page components (Customers, Products, Inventory, Orders)
│   │   ├── services/        # API services (api, customer, product, inventory, order, auth)
│   │   ├── context/         # React context (AuthContext)
│   │   ├── types/           # TypeScript types (future)
│   │   ├── App.tsx          # Main app component with routing
│   │   └── main.tsx         # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── postcss.config.js
├── backend/
│   ├── src/
│   │   ├── __tests__/       # Test files (auth, database, business validators)
│   │   ├── config/          # Configuration files (database, migration, env)
│   │   ├── controllers/     # Request handlers (auth, user, health, customer, product, inventory, order)
│   │   ├── middleware/      # Express middleware (auth, error handling)
│   │   ├── migrations/      # SQL migration files (users, business tables)
│   │   ├── routes/          # API routes (auth, user, health, customer, product, inventory, order)
│   │   ├── services/        # Business logic (user, customer, product, inventory, order)
│   │   ├── utils/           # Utility functions (password, JWT)
│   │   ├── validators/      # Input validation (auth, business validators)
│   │   ├── types/           # TypeScript types (user, customer, product, inventory, order)
│   │   ├── app.ts           # Express app configuration
│   │   └── server.ts        # Server entry point
│   ├── jest.config.js       # Jest test configuration
│   ├── package.json
│   └── tsconfig.json
├── .gitignore
├── .env.example
└── README.md
```

## Frontend Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
VITE_API_URL=http://localhost:5000
```

## Backend Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- PostgreSQL (local or Neon) - Ensure PostgreSQL is running and accessible

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/fundsroom_erp_crm

# JWT Configuration
JWT_SECRET=your_jwt_secret_here_change_this_in_production

# Frontend Configuration
FRONTEND_URL=http://localhost:5173
```

5. Ensure PostgreSQL is running and the database exists:
```bash
# Create database (if needed)
createdb fundsroom_erp_crm
```

## Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment mode (development/production)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT authentication (use strong random string in production)
- `FRONTEND_URL` - Frontend application URL for CORS

### Frontend (.env)
- `VITE_API_URL` - Backend API base URL

**Security Note:** Never commit actual `.env` files to version control. Use `.env.example` as a template and create local `.env` files with your actual values.

## How to Run Frontend

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to:
```
http://localhost:5173
```

4. For production build:
```bash
npm run build
npm run preview
```

## How to Run Backend

1. Navigate to the backend directory:
```bash
cd backend
```

2. Start the development server:
```bash
npm run dev
```

3. The server will start on:
```
http://localhost:5000
```

4. For production:
```bash
npm run build
npm start
```

## API Documentation

### Health API

#### GET /api/health

Check if the API is running.

**Response:**
```json
{
  "success": true,
  "message": "Fundsroom ERP CRM API is running"
}
```

**Status Code:** 200 OK

### Authentication API

#### POST /api/auth/register

Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Secure@123",
  "first_name": "John",
  "last_name": "Doe",
  "role": "user"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&)

**Response (Success):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "user",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Status Code:** 201 Created

**Response (Error):**
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

**Status Code:** 409 Conflict

#### POST /api/auth/login

Authenticate a user and receive a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Secure@123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "user",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Status Code:** 200 OK

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

**Status Code:** 401 Unauthorized

#### GET /api/auth/profile

Get the current user's profile (Protected Route).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Status Code:** 200 OK

**Response (Error):**
```json
{
  "success": false,
  "message": "No token provided"
}
```

**Status Code:** 401 Unauthorized

### User Management API (Admin Only)

#### GET /api/users

Get all users (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (Success):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "email": "admin@fundsroom.com",
      "first_name": "Admin",
      "last_name": "User",
      "role": "admin",
      "is_active": true,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Status Code:** 200 OK

#### GET /api/users/:id

Get a specific user by ID (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Status Code:** 200 OK

### Customer Management API

#### POST /api/customers
Create a new customer (Authenticated).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "company_name": "Acme Corporation",
  "contact_person": "John Smith",
  "email": "john@acme.com",
  "phone": "+1234567890",
  "address": "123 Business St",
  "city": "Mumbai",
  "state": "Maharashtra",
  "postal_code": "400001",
  "country": "India",
  "credit_limit": 100000
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Customer created successfully",
  "data": {
    "id": 1,
    "company_name": "Acme Corporation",
    "contact_person": "John Smith",
    "email": "john@acme.com",
    "phone": "+1234567890",
    "address": "123 Business St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "postal_code": "400001",
    "country": "India",
    "credit_limit": 100000,
    "current_balance": 0,
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

**Status Code:** 201 Created

#### GET /api/customers
Get all customers with pagination (Authenticated).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search term for company name, contact person, email, or phone

**Response (Success):**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

**Status Code:** 200 OK

#### GET /api/customers/:id
Get customer by ID (Authenticated).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "company_name": "Acme Corporation",
    ...
  }
}
```

**Status Code:** 200 OK

#### PUT /api/customers/:id
Update customer (Authenticated).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "company_name": "Updated Company Name",
  "contact_person": "Jane Doe",
  "email": "jane@acme.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Customer updated successfully",
  "data": {...}
}
```

**Status Code:** 200 OK

#### DELETE /api/customers/:id
Delete customer (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Customer deleted successfully"
}
```

**Status Code:** 200 OK

### Product Management API

#### POST /api/products
Create a new product (Authenticated).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "sku": "PROD-001",
  "name": "Widget A",
  "description": "High-quality widget",
  "category": "Electronics",
  "unit": "pcs",
  "base_price": 100,
  "selling_price": 150,
  "tax_rate": 18,
  "hsn_code": "8517",
  "reorder_level": 10
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "id": 1,
    "sku": "PROD-001",
    "name": "Widget A",
    ...
  }
}
```

**Status Code:** 201 Created

#### GET /api/products
Get all products with pagination (Authenticated).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search term for SKU, name, or category

**Response (Success):**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "pages": 5
  }
}
```

**Status Code:** 200 OK

#### GET /api/products/active
Get all active products (Authenticated).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Success):**
```json
{
  "success": true,
  "data": [...]
}
```

**Status Code:** 200 OK

#### PUT /api/products/:id
Update product (Authenticated).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Updated Product Name",
  "selling_price": 175
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {...}
}
```

**Status Code:** 200 OK

#### DELETE /api/products/:id
Delete product (Admin only).

**Headers:**
```
Authorization: Bearer <admin_token>
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Product deleted successfully"
}
```

**Status Code:** 200 OK

### Inventory Management API

#### POST /api/inventory
Create inventory record (Authenticated).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "product_id": 1,
  "quantity": 100,
  "location": "Warehouse A",
  "warehouse": "Main Warehouse"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Inventory record created successfully",
  "data": {
    "id": 1,
    "product_id": 1,
    "quantity": 100,
    "reserved_quantity": 0,
    "available_quantity": 100,
    ...
  }
}
```

**Status Code:** 201 Created

#### GET /api/inventory
Get all inventory records (Authenticated).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Success):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "product_id": 1,
      "quantity": 100,
      "reserved_quantity": 0,
      "available_quantity": 100,
      "product_name": "Widget A",
      "sku": "PROD-001",
      ...
    }
  ]
}
```

**Status Code:** 200 OK

#### GET /api/inventory/low-stock
Get low stock products (Authenticated).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `threshold` - Low stock threshold (default: 10)

**Response (Success):**
```json
{
  "success": true,
  "data": [...]
}
```

**Status Code:** 200 OK

#### POST /api/inventory/movements
Record stock movement (Authenticated).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "product_id": 1,
  "quantity": 50,
  "movement_type": "in",
  "reference_type": "purchase",
  "reference_id": 123,
  "notes": "Stock purchase"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Stock movement recorded successfully"
}
```

**Status Code:** 201 Created

### Order Management API

#### POST /api/orders
Create a new order (Authenticated).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "customer_id": 1,
  "order_date": "2024-01-15",
  "delivery_date": "2024-01-20",
  "status": "pending",
  "notes": "Urgent delivery",
  "items": [
    {
      "product_id": 1,
      "quantity": 10,
      "unit_price": 150,
      "tax_rate": 18,
      "item_discount_amount": 0
    }
  ]
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "id": 1,
    "order_number": "ORD-20240115-0001",
    "customer_id": 1,
    "order_date": "2024-01-15",
    "status": "pending",
    "subtotal": 1500,
    "tax_amount": 270,
    "discount_amount": 0,
    "total_amount": 1770,
    ...
  }
}
```

**Status Code:** 201 Created

#### GET /api/orders
Get all orders with pagination (Authenticated).

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search term for order number, customer name, or status

**Response (Success):**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 15,
    "pages": 2
  }
}
```

**Status Code:** 200 OK

#### GET /api/orders/:id
Get order by ID with items (Authenticated).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "order_number": "ORD-20240115-0001",
    "customer_name": "Acme Corporation",
    "customer_email": "john@acme.com",
    "status": "pending",
    "total_amount": 1770,
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "quantity": 10,
        "unit_price": 150,
        "subtotal": 1500,
        "total_amount": 1770,
        "product_name": "Widget A",
        "product_sku": "PROD-001"
      }
    ]
  }
}
```

**Status Code:** 200 OK

#### PATCH /api/orders/:id/status
Update order status (Authenticated).

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "status": "confirmed"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Order status updated successfully",
  "data": {...}
}
```

**Status Code:** 200 OK

#### GET /api/orders/stats
Get order statistics (Authenticated).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (Success):**
```json
{
  "success": true,
  "data": {
    "total_orders": 25,
    "pending_orders": 5,
    "confirmed_orders": 10,
    "delivered_orders": 8,
    "total_revenue": 42500
  }
}
```

**Status Code:** 200 OK

## Development Scripts

### Backend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Start production server
- `npm run type-check` - Run TypeScript type checking
- `npm run lint` - Run ESLint
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode

### Frontend
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run linter

## TypeScript Compilation

Both frontend and backend use TypeScript for type safety. The projects are configured to:

- Strict type checking
- ES2020 target
- CommonJS modules (backend)
- ES modules (frontend)
- Source map generation for debugging

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_users_email` - For faster email lookups
- `idx_users_role` - For filtering by role
- `idx_users_is_active` - For filtering active users

**Default User:**
- Email: `admin@fundsroom.com`
- Password: `Admin@123` (Change this in production!)
- Role: `admin`

### Customers Table

```sql
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  company_name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'India',
  tax_id VARCHAR(50),
  credit_limit DECIMAL(15, 2) DEFAULT 0,
  current_balance DECIMAL(15, 2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_customers_email` - For email uniqueness and lookups
- `idx_customers_company` - For company name searches
- `idx_customers_is_active` - For filtering active customers

### Products Table

```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  sku VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  unit VARCHAR(50) DEFAULT 'pcs',
  base_price DECIMAL(15, 2) NOT NULL,
  selling_price DECIMAL(15, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  hsn_code VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  reorder_level INTEGER DEFAULT 10,
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_products_sku` - For SKU uniqueness and lookups
- `idx_products_name` - For product name searches
- `idx_products_category` - For category filtering
- `idx_products_is_active` - For filtering active products

### Inventory Table

```sql
CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
  location VARCHAR(100),
  warehouse VARCHAR(100),
  last_stock_update TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(product_id, location)
);
```

**Indexes:**
- `idx_inventory_product_id` - For product lookups
- `idx_inventory_location` - For location filtering
- `idx_inventory_warehouse` - For warehouse filtering

### Orders Table

```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_date DATE,
  status VARCHAR(50) DEFAULT 'pending',
  subtotal DECIMAL(15, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  updated_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_orders_order_number` - For order number lookups
- `idx_orders_customer_id` - For customer order history
- `idx_orders_status` - For status filtering
- `idx_orders_order_date` - For date-based queries

### Order Items Table

```sql
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(15, 2) NOT NULL,
  tax_rate DECIMAL(5, 2) DEFAULT 0,
  discount_amount DECIMAL(15, 2) DEFAULT 0,
  subtotal DECIMAL(15, 2) GENERATED ALWAYS AS (quantity * unit_price - discount_amount) STORED,
  total_amount DECIMAL(15, 2) GENERATED ALWAYS AS (subtotal + (subtotal * tax_rate / 100)) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_order_items_order_id` - For order item lookups
- `idx_order_items_product_id` - For product sales tracking

### Stock Movements Table

```sql
CREATE TABLE stock_movements (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id),
  movement_type VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL,
  reference_type VARCHAR(50),
  reference_id INTEGER,
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
- `idx_stock_movements_product_id` - For product movement history
- `idx_stock_movements_movement_type` - For movement type filtering
- `idx_stock_movements_created_at` - For date-based queries

## Testing

The backend includes a comprehensive test suite using Jest:

### Running Tests
```bash
cd backend
npm test
```

### Test Coverage
- Database connection tests
- Password hashing and verification
- JWT token generation and verification
- Request validation schemas (auth and business validators)
- Authentication flows
- Business module validation (customers, products, inventory, orders)

**Current Test Results:** 47 tests passing (23 from Phase 2 + 24 from Phase 3)

## Next Steps

Phase 3 will include:
- Customer management (CRM module)
- Product and inventory management
- Sales challan generation
- Stock movement tracking

## License

ISC

## Author

Fundsroom Infotech Pvt. Ltd.

---

**Note:** This project is under active development. Features and implementation details may change as we progress through the planned phases.
