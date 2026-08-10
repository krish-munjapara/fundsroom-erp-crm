import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_here',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
};
