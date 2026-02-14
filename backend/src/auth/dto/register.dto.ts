export class RegisterDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  password: string;
  tenantId: string;
  role?: string;
}
