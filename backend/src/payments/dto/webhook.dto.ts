import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsObject } from 'class-validator';

/**
 * DTO para webhooks de MercadoPago
 * La estructura puede variar según el tipo de notificación
 */
export class WebhookDto {
  @ApiPropertyOptional({ description: 'Tipo de notificación de MercadoPago' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Datos de la notificación' })
  @IsOptional()
  @IsObject()
  data?: {
    id?: string;
  };

  @ApiPropertyOptional({ description: 'ID de la notificación' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ description: 'Fecha de creación' })
  @IsOptional()
  @IsString()
  date_created?: string;

  @ApiPropertyOptional({ description: 'ID del usuario de MercadoPago' })
  @IsOptional()
  @IsString()
  user_id?: string;

  @ApiPropertyOptional({ description: 'Versión de la API' })
  @IsOptional()
  @IsString()
  api_version?: string;

  @ApiPropertyOptional({ description: 'Acción realizada' })
  @IsOptional()
  @IsString()
  action?: string;

  // Permitir propiedades adicionales ya que MercadoPago puede enviar campos variables
  [key: string]: unknown;
}
