import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateTenantWithAdminDto {
  @IsOptional()
  @IsString()
  tenantId?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsString()
  adminFirstName: string;

  @IsString()
  adminLastName: string;

  @IsEmail()
  adminEmail: string;

  @IsOptional()
  @IsString()
  adminPhone?: string;

  @IsString()
  @MinLength(6)
  adminPassword: string;
}
