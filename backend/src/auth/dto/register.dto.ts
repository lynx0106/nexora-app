import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
  IsUUID,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../common/constants/roles';

export class RegisterDto {
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

  @ApiProperty({
    example: 'password123',
    description: 'User password - minimum 6 characters',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({
    example: 'restaurante-demo',
    description: 'Tenant ID (opcional si se usa invitationId)',
  })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiPropertyOptional({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'ID de la invitación (reemplaza tenantId y role)',
  })
  @IsOptional()
  @IsUUID()
  invitationId?: string;

  @ApiPropertyOptional({
    enum: Role,
    description: 'User role - defaults to user if not specified',
    default: 'user',
  })
  @IsOptional()
  @IsIn(Object.values(Role))
  role?: string;
}
