import {
  IsDateString,
  IsOptional,
  IsString,
  IsInt,
  Min,
} from 'class-validator';

export class CreateAppointmentDto {
  @IsDateString()
  dateTime: string; // ISO string

  @IsOptional()
  @IsString()
  doctorId?: string;

  @IsString()
  clientId: string;

  @IsOptional()
  @IsString()
  serviceId?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  pax?: number;

  @IsOptional()
  @IsString()
  occasion?: string;

  @IsString()
  tenantId: string;
}
