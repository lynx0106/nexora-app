import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';

/**
 * Guard que protege endpoints de setup/inicialización (seed superadmin, db-init, diagnostic).
 * En producción: requiere header X-Setup-Secret igual a SETUP_SECRET.
 * Si SETUP_SECRET no está definido en producción, siempre bloquea.
 * En desarrollo: permite por defecto (para setup local).
 */
@Injectable()
export class SetupGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const isProduction = process.env.NODE_ENV === 'production';
    const setupSecret = process.env.SETUP_SECRET;
    const providedSecret = request.headers['x-setup-secret'] as string | undefined;

    // En desarrollo sin SETUP_SECRET: permitir (conveniencia para setup local)
    if (!isProduction && !setupSecret) {
      return true;
    }

    // En producción sin SETUP_SECRET: bloquear siempre (endpoints deshabilitados)
    if (isProduction && !setupSecret) {
      throw new ForbiddenException(
        'Setup endpoints are disabled in production. Configure SETUP_SECRET to enable.',
      );
    }

    // Si SETUP_SECRET está definido, requiere coincidencia
    if (providedSecret !== setupSecret) {
      throw new ForbiddenException('Invalid or missing setup secret');
    }

    return true;
  }
}
