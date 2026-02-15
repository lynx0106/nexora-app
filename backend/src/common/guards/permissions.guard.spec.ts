import { ForbiddenException } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';
import { Permission, rolePermissions } from '../constants/permissions';
import { Role } from '../constants/roles';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import type { ExecutionContext } from '@nestjs/common';

const createContext = (
  user: any,
  permissions?: Permission[],
): ExecutionContext => {
  const handler = () => null;
  class DummyClass {}

  if (permissions) {
    Reflect.defineMetadata(PERMISSIONS_KEY, permissions, handler);
  }

  return {
    getHandler: () => handler,
    getClass: () => DummyClass,
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as ExecutionContext;
};

describe('PermissionsGuard', () => {
  it('allows access when no permissions are required', () => {
    const guard = new PermissionsGuard();
    const context = createContext({ role: Role.Admin });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects when role is missing', () => {
    const guard = new PermissionsGuard();
    const context = createContext({}, [Permission.UserRead]);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('allows superadmin even without explicit mapping', () => {
    const guard = new PermissionsGuard();
    const context = createContext({ role: Role.Superadmin }, [
      Permission.ReportExport,
    ]);

    expect(guard.canActivate(context)).toBe(true);
  });

  it('rejects when permission is missing', () => {
    const guard = new PermissionsGuard();
    const context = createContext({ role: Role.User }, [
      Permission.UserManage,
    ]);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('allows when permission is present', () => {
    const guard = new PermissionsGuard();
    const context = createContext({ role: Role.Admin }, [
      Permission.UserManage,
    ]);

    expect(guard.canActivate(context)).toBe(true);
  });
});

describe('rolePermissions', () => {
  it('includes user management for admin', () => {
    expect(rolePermissions[Role.Admin]).toContain(Permission.UserManage);
  });
});
