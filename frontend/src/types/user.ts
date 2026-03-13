export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: 'superadmin' | 'admin' | 'employee' | 'client';
  employeeType?: string;
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
}
