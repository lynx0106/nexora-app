import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, rolePermissions } from '../constants/permissions';
import { Role } from '../constants/roles';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  private readonly reflector = new Reflector();

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const role = user?.role as Role | undefined;

    if (!role) {
      throw new ForbiddenException('Rol no identificado');
    }

    if (role === Role.Superadmin) {
      return true;
    }

    const allowed = rolePermissions[role] || [];
    const hasAll = required.every((permission) => allowed.includes(permission));

    if (!hasAll) {
      throw new ForbiddenException('No tienes permisos');
    }

    return true;
  }
}
