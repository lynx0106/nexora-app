type ErrorContext = {
  requestId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  code?: string;
  tenantId?: string;
  userId?: string;
};

export async function reportError(
  error: unknown,
  context: ErrorContext,
): Promise<void> {
  const endpoint = process.env.ERROR_TRACKING_URL;
  if (!endpoint) return;

  try {
    const payload = {
      message: error instanceof Error ? error.message : 'Error desconocido',
      stack: error instanceof Error ? error.stack : undefined,
      context,
      timestamp: new Date().toISOString(),
      service: 'backend',
    };

    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // Evita romper el flujo si el tracker falla.
  }
}
