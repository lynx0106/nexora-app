import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export type InvitationRole = 'client' | 'employee';

export class GenerateInvitationDto {
  @ApiProperty({
    description: 'Rol que tendrá el usuario invitado',
    enum: ['client', 'employee'],
    default: 'client',
    example: 'client',
  })
  @IsEnum(['client', 'employee'])
  @IsOptional()
  role?: InvitationRole = 'client';

  @ApiPropertyOptional({
    description: 'ID del tenant (solo para superadmin)',
    example: 'restaurante-demo',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  tenantId?: string;
}

export class ValidateInvitationDto {
  @ApiProperty({
    description: 'ID de la invitación a validar',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  id: string;
}

export class UseInvitationDto {
  @ApiProperty({
    description: 'ID de la invitación a usar',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  invitationId: string;

  @ApiProperty({
    description: 'ID del usuario que usa la invitación',
    example: 'user-uuid',
  })
  @IsUUID()
  userId: string;
}
