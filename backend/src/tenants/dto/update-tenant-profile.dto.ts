import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateTenantProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

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
  address?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  openingTime?: string;

  @IsOptional()
  @IsString()
  closingTime?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  appointmentDuration?: number;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  coverUrl?: string;

  @IsOptional()
  @IsString()
  aiPromptCustomer?: string;

  @IsOptional()
  @IsString()
  aiPromptSupport?: string;

  @IsOptional()
  @IsString()
  aiPromptInternal?: string;

  @IsOptional()
  @IsString()
  mercadoPagoPublicKey?: string;

  @IsOptional()
  @IsString()
  mercadoPagoAccessToken?: string;

  @IsOptional()
  @IsString()
  openaiApiKey?: string;

  @IsOptional()
  @IsString()
  aiModel?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  tablesCount?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  capacity?: number;
}
