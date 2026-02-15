import {
  IsEmail,
  IsOptional,
  IsString,
  IsISO8601,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class PublicAppointmentClientDto {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreatePublicAppointmentDto {
  @IsString()
  serviceId: string;

  @IsISO8601()
  dateTime: string;

  @ValidateNested()
  @Type(() => PublicAppointmentClientDto)
  client: PublicAppointmentClientDto;

  @IsOptional()
  @IsString()
  captchaToken?: string;

  @IsOptional()
  @IsString()
  website?: string; // Honeypot
}
