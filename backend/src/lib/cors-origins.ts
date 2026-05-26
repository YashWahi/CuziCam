const DEV_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000'];

/** Strip trailing slashes so https://app.com and https://app.com/ both match. */
export function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '');
}

/**
 * Build the allow-list from env:
 * - FRONTEND_URL — primary deployed frontend (required in production)
 * - CLIENT_URL — legacy alias
 * - CORS_ORIGINS — comma-separated extra origins (preview URLs, Render + Vercel, etc.)
 */
export function getAllowedOrigins(): string[] {
  const raw: string[] = [];

  for (const key of ['FRONTEND_URL', 'CLIENT_URL'] as const) {
    const value = process.env[key];
    if (value) raw.push(value);
  }

  const corsOrigins = process.env.CORS_ORIGINS;
  if (corsOrigins) {
    raw.push(...corsOrigins.split(','));
  }

  const origins = raw.map(normalizeOrigin).filter(Boolean);

  if (process.env.NODE_ENV !== 'production') {
    origins.push(...DEV_ORIGINS);
  }

  return [...new Set(origins)];
}

export function isOriginAllowed(origin: string | undefined, allowedOrigins: string[]): boolean {
  if (!origin) return true;
  return allowedOrigins.includes(normalizeOrigin(origin));
}
