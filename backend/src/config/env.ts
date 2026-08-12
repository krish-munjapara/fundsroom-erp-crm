import dotenv from 'dotenv';

// Load .env for local development; Render injects env vars directly in production
if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const PLACEHOLDER_JWT_SECRETS = [
  'your_jwt_secret_here_change_this_in_production',
  'dev-only-jwt-secret-change-me',
];

function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

function resolvePort(): number {
  const parsed = Number(process.env.PORT);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5000;
}

function resolveDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL?.trim() || '';

  if (isProduction() && !databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required in production');
  }

  return databaseUrl;
}

function resolveFrontendUrl(): string {
  const frontendUrl = process.env.FRONTEND_URL?.trim();

  if (isProduction()) {
    if (!frontendUrl) {
      throw new Error('FRONTEND_URL environment variable is required in production');
    }
    return frontendUrl;
  }

  return frontendUrl || 'http://localhost:5173';
}

function resolveJwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();

  if (isProduction()) {
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is required in production');
    }

    const normalized = secret.toLowerCase();
    if (PLACEHOLDER_JWT_SECRETS.some((placeholder) => normalized === placeholder.toLowerCase())) {
      throw new Error(
        'JWT_SECRET must be set to a strong secret in production (placeholder value detected)'
      );
    }

    return secret;
  }

  if (secret) {
    return secret;
  }

  // Development-only fallback — never used when NODE_ENV=production
  return 'dev-only-jwt-secret-change-me';
}

export const config = {
  port: resolvePort(),
  databaseUrl: resolveDatabaseUrl(),
  jwtSecret: resolveJwtSecret(),
  frontendUrl: resolveFrontendUrl(),
  nodeEnv: process.env.NODE_ENV || 'development',
};
