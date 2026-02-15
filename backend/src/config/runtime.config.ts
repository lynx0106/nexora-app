export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET no esta configurado');
  }

  return secret;
}

export function getCorsOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS;
  const parsed = raw
    ? raw
        .split(',')
        .map((origin) => origin.trim())
        .filter((origin) => origin.length > 0)
    : [];

  if (parsed.length > 0) {
    return parsed;
  }

  if (process.env.FRONTEND_URL) {
    return [process.env.FRONTEND_URL];
  }

  return ['http://localhost:3002'];
}
