import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  IsDateString,
  IsNumber,
  IsEnum,
  Min,
} from 'class-validator';

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export class UpdateAppointmentDto {
  @ApiPropertyOptional({ description: 'Fecha y hora de la cita' })
  @IsOptional()
  @IsDateString()
  dateTime?: string;

  @ApiPropertyOptional({ description: 'Notas adicionales' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Número de personas' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  pax?: number;

  @ApiPropertyOptional({ description: 'Ocasión especial' })
  @IsOptional()
  @IsString()
  occasion?: string;

  @ApiPropertyOptional({ description: 'ID del doctor/profesional' })
  @IsOptional()
  @IsUUID()
  doctorId?: string;

  @ApiPropertyOptional({ description: 'ID del servicio' })
  @IsOptional()
  @IsUUID()
  serviceId?: string;
}
