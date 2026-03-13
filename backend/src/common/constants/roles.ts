export enum Role {
  Superadmin = 'superadmin',
  Admin = 'admin',
  Employee = 'employee',
  Client = 'client',
}

export function hasRole(role: string | undefined, allowed: Role[]): boolean {
  if (!role) return false;
  return allowed.includes(role as Role);
}
