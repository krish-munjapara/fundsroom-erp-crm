# Fundsroom ERP CRM

A Mini ERP + CRM Operations Portal for wholesale/distribution companies, built for Fundsroom Infotech Pvt. Ltd.

## Project Overview

This is a full-stack web application designed to manage business operations for wholesale and distribution companies. The system will handle customer relationships, inventory management, sales tracking, and operational workflows.

**Important:** This project is being implemented in controlled phases. Phase 1 is currently complete, which establishes the project foundation.

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

### Authentication (Future Phase)
- **JWT** - JSON Web Tokens for authentication

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

### 🔄 Future Phases (Not Yet Implemented)
- Database schema and migrations
- Authentication and authorization
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
│   │   ├── config/          # Configuration files
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic (future)
│   │   ├── validators/      # Input validation (future)
│   │   ├── types/           # TypeScript types (future)
│   │   ├── app.ts           # Express app configuration
│   │   └── server.ts        # Server entry point
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
- PostgreSQL (local or Neon)

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
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/fundsroom_erp_crm
JWT_SECRET=your_jwt_secret_here
FRONTEND_URL=http://localhost:5173
```

## Environment Variables

### Backend (.env)
- `PORT` - Server port (default: 5000)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT authentication
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

## Health API Documentation

### GET /api/health

Check if the API is running.

**Response:**
```json
{
  "success": true,
  "message": "Fundsroom ERP CRM API is running"
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

## Next Steps

Phase 2 will include:
- Database schema design
- PostgreSQL connection setup
- User authentication implementation
- Basic CRUD operations

## License

ISC

## Author

Fundsroom Infotech Pvt. Ltd.

---

**Note:** This project is under active development. Features and implementation details may change as we progress through the planned phases.
