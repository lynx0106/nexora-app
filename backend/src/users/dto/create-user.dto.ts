import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../common/constants/roles';

export class CreateUserDto {
  @ApiProperty({ example: 'John', description: 'User first name' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'User last name' })
  @IsString()
  lastName: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'User email address',
  })
  @IsEmail()
  email: string;

  @ValidateIf((o) => !o.generateTempPassword)
  @ApiPropertyOptional({
    example: 'password123',
    description: 'User password (required unless generateTempPassword=true)',
    minLength: 6,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({
    description:
      'When true, backend generates secure temp password and returns it in response',
  })
  @IsOptional()
  @IsBoolean()
  generateTempPassword?: boolean;

  @ApiPropertyOptional({
    example: '+573001234567',
    description: 'User phone number',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '123 Main St', description: 'User address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'User avatar URL',
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({
    enum: Role,
    description: 'User role: admin, employee, client',
    default: 'employee',
  })
  @IsOptional()
  @IsIn(Object.values(Role))
  role?: string;

  @ApiPropertyOptional({
    example: 'medico',
    description: 'Clasificación del empleado: medico, recepcionista, auxiliar, etc. (solo si role=employee)',
  })
  @IsOptional()
  @IsString()
  employeeType?: string;

  @ApiPropertyOptional({
    example: 'restaurante-demo',
    description: 'Tenant ID for multi-tenant organization',
  })
  @IsOptional()
  @IsString()
  tenantId?: string;
}
