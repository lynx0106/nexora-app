import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';
  
  if (!dsn) {
    console.log('⚠️ SENTRY_DSN not configured, skipping Sentry initialization');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    integrations: [
      nodeProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    // Profiling
    profilesSampleRate: environment === 'production' ? 0.1 : 1.0,
    // Release tracking
    release: process.env.npm_package_version || '1.0.0',
    // Ignore common errors
    ignoreErrors: [
      'NotFoundException',
      'UnauthorizedException',
      'BadRequestException',
      'ConflictException',
    ],
  });

  console.log(`✅ Sentry initialized in ${environment} environment`);
}

// Helper to capture errors with context
export function captureError(error: Error, context?: Record<string, any>) {
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }
    Sentry.captureException(error);
  });
}

// Helper to set user context
export function setSentryUser(user: { id: string; email?: string; tenantId?: string; role?: string }) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    tenantId: user.tenantId,
    role: user.role,
  });
}

// Helper to clear user context
export function clearSentryUser() {
  Sentry.setUser(null);
}

// Helper to add breadcrumb
export function addBreadcrumb(
  category: string,
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  data?: Record<string, any>
) {
  Sentry.addBreadcrumb({
    category,
    message,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}
