# Fundsroom ERP CRM

A Mini ERP + CRM Operations Portal for wholesale/distribution companies, built for Fundsroom Infotech Pvt. Ltd.

## Project Overview

This is a full-stack web application designed to manage business operations for wholesale and distribution companies. The system will handle customer relationships, inventory management, sales tracking, and operational workflows.

**Important:** This project is being implemented in controlled phases. Phase 2 is currently complete, which includes database setup and user authentication.

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

### 🔄 Future Phases (Not Yet Implemented)
- Customer management (CRM)
- Product and inventory management
- Sales challan generation
- Stock movement tracking
- Dashboard and analytics
- PDF generation
- Deployment configuration

## Project Structure

```
fundsroom-erp-crm/
├── frontend/
│   ├── src/
│   │   ├── components/      # React components (future)
│   │   ├── pages/           # Page components (future)
│   │   ├── services/        # API services (future)
│   │   ├── context/         # React context (future)
│   │   ├── types/           # TypeScript types (future)
│   │   ├── App.tsx          # Main app component
│   │   └── main.tsx         # Entry point
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── postcss.config.js
├── backend/
│   ├── src/
│   │   ├── __tests__/       # Test files
│   │   ├── config/          # Configuration files (database, migration, env)
│   │   ├── controllers/     # Request handlers (auth, user, health)
│   │   ├── middleware/      # Express middleware (auth, error handling)
│   │   ├── migrations/      # SQL migration files
│   │   ├── routes/          # API routes (auth, user, health)
│   │   ├── services/        # Business logic (user service)
│   │   ├── utils/           # Utility functions (password, JWT)
│   │   ├── validators/      # Input validation (auth validators)
│   │   ├── types/           # TypeScript types
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
- Request validation schemas
- Authentication flows

**Current Test Results:** 23 tests passing

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
