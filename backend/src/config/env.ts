import dotenv from 'dotenv';

dotenv.config();

function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }

  // Development-only fallback — never used when NODE_ENV=production
  return 'dev-only-jwt-secret-change-me';
}

export const config = {
  port: process.env.PORT || 5000,
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: resolveJwtSecret(),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV || 'development',
};
