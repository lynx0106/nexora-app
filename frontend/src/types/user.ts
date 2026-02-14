export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: 'superadmin' | 'admin' | 'operative' | 'user';
  tenantId?: string;
  createdAt: string;
  updatedAt: string;
}
