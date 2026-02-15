import { Role } from './roles';

export enum Permission {
  TenantRead = 'tenant:read',
  TenantManage = 'tenant:manage',
  UserRead = 'user:read',
  UserManage = 'user:manage',
  ProductRead = 'product:read',
  ProductManage = 'product:manage',
  OrderRead = 'order:read',
  OrderManage = 'order:manage',
  ReportExport = 'report:export',
  InvitationCreate = 'invitation:create',
}

const adminPermissions: Permission[] = [
  Permission.TenantRead,
  Permission.TenantManage,
  Permission.UserRead,
  Permission.UserManage,
  Permission.ProductRead,
  Permission.ProductManage,
  Permission.OrderRead,
  Permission.OrderManage,
  Permission.ReportExport,
  Permission.InvitationCreate,
];

const staffPermissions: Permission[] = [
  Permission.ProductRead,
  Permission.OrderRead,
  Permission.OrderManage,
];

const userPermissions: Permission[] = [
  Permission.ProductRead,
  Permission.OrderRead,
  Permission.OrderManage,
];

export const rolePermissions: Record<Role, Permission[]> = {
  [Role.Superadmin]: Object.values(Permission),
  [Role.Admin]: adminPermissions,
  [Role.Staff]: staffPermissions,
  [Role.Employee]: staffPermissions,
  [Role.Support]: staffPermissions,
  [Role.Doctor]: staffPermissions,
  [Role.User]: userPermissions,
  [Role.Client]: userPermissions,
};

export function hasPermission(
  role: Role | undefined,
  permission: Permission,
): boolean {
  if (!role) return false;
  if (role === Role.Superadmin) return true;
  return (rolePermissions[role] || []).includes(permission);
}

export function hasAllPermissions(
  role: Role | undefined,
  permissions: Permission[],
): boolean {
  if (!role) return false;
  if (role === Role.Superadmin) return true;
  const allowed = rolePermissions[role] || [];
  return permissions.every((permission) => allowed.includes(permission));
}
