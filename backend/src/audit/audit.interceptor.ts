import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from './audit.service';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private logger = new Logger(AuditInterceptor.name);

  constructor(
    private auditService: AuditService,
    private reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method = req.method;
    const url = req.url;
    const user = req.user;

    // Only log state-changing methods (POST, PATCH, DELETE) or specific critical GETs
    if (!['POST', 'PATCH', 'DELETE', 'PUT'].includes(method)) {
      return next.handle();
    }

    // Skip login/register endpoints as they are handled manually or don't have req.user yet
    if (url.includes('/auth/login') || url.includes('/auth/register')) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (response) => {
        if (!user) return; // Should not happen if guarded, but safety check

        try {
          // Determine entity type from URL (simple heuristic)
          // /orders/123 -> Entity: Order, ID: 123
          const segments = url.split('/').filter((s) => s && s !== 'api');
          const entityType = segments[0]
            ? segments[0].charAt(0).toUpperCase() + segments[0].slice(1, -1) // orders -> Order
            : 'System';
          
          const entityId = segments[1] || (response && response.id ? response.id : null);

          await this.auditService.logAction({
            tenantId: user.tenantId,
            userId: user.userId,
            userEmail: user.email,
            action: method, // POST=CREATE, PATCH=UPDATE, DELETE=DELETE
            entityType: entityType, // e.g., 'Order'
            entityId: entityId,
            details: JSON.stringify({ url, body: req.body }), // Be careful with PII in body
            ipAddress: req.ip || req.connection.remoteAddress,
          });
        } catch (err) {
          this.logger.error('Failed to log audit entry', err);
        }
      }),
    );
  }
}
