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
  const raw = process.env.CORS_ORIGINS;
  if (raw) {
    // En producción, no usar CORS_ORIGINS=* por seguridad; usar orígenes por defecto
    if (raw.trim() === '*' && process.env.NODE_ENV === 'production') {
      // Fall through to use production origins below
    } else if (raw.trim() !== '*') {
      return raw
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0);
    }
  }

  // Production domains (always included)
  const productionOrigins = [
    'https://nexora-app.online',
    'https://www.nexora-app.online',
    'https://nexora-app-production-3104.up.railway.app',
  ];

  // If FRONTEND_URL is set, add it
  if (process.env.FRONTEND_URL) {
    productionOrigins.push(process.env.FRONTEND_URL);
  }

  // Always include production origins + localhost for development
  const allOrigins = [
    'http://localhost:3002',
    'http://localhost:3000',
    ...productionOrigins
  ];

  // Remove duplicates
  return [...new Set(allOrigins)];
}
