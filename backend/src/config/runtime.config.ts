export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET no esta configurado');
  }

  return secret;
}

/**
 * Get allowed CORS origins
 * Priority: CORS_ORIGINS env var > FRONTEND_URL env var > Production defaults > Localhost
 */
export function getCorsOrigins(): string[] {
  // If explicit CORS_ORIGINS is set, use it
  const raw = process.env.CORS_ORIGINS;
  if (raw) {
    return raw
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0);
  }

  // Production domains (always allowed in production)
  const productionOrigins = [
    'https://nexora-app.online',
    'https://www.nexora-app.online',
    'https://nexora-app-production-3199.up.railway.app',
  ];

  // If FRONTEND_URL is set, add it
  if (process.env.FRONTEND_URL) {
    productionOrigins.push(process.env.FRONTEND_URL);
  }

  // In production, return production origins
  if (process.env.NODE_ENV === 'production') {
    // Remove duplicates
    return [...new Set(productionOrigins)];
  }

  // In development, allow localhost
  return ['http://localhost:3002', 'http://localhost:3000', ...productionOrigins];
}
