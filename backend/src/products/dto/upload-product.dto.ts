import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class UploadProductDto {
  @ApiPropertyOptional({ description: 'ID del tenant (solo para superadmin)' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}
