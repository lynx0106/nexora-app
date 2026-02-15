import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  UseGuards,
  ForbiddenException,
  Delete,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { TenantsService } from './tenants.service';
import { CreateTenantWithAdminDto } from './dto/create-tenant-with-admin.dto';
import { RegisterTenantDto } from './dto/register-tenant.dto';
import { UpdateTenantProfileDto } from './dto/update-tenant-profile.dto';
import { Role, hasRole } from '../common/constants/roles';


interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    tenantId?: string;
    role?: string;
  };
}

@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post('register')
  async register(@Body() body: RegisterTenantDto) {
    // Generate a unique tenantId from the name
    const tenantId = await this.tenantsService.generateAvailableTenantId(
      body.name,
    );

    return this.tenantsService.createTenantWithAdmin({
      tenantId: tenantId,
      name: body.name,
      sector: body.sector,
      country: body.country,
      currency: body.currency,
      adminFirstName: body.adminFirstName,
      adminLastName: body.adminLastName,
      adminEmail: body.adminEmail,
      adminPassword: body.adminPassword,
    });
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createTenantWithAdmin(
    @Req() req: AuthRequest,
    @Body() dto: CreateTenantWithAdminDto,
  ) {
    const role = req.user?.role;
    if (!hasRole(role, [Role.Superadmin])) {
      throw new ForbiddenException(
        'Solo el superadmin puede crear nuevos tenants',
      );
    }

    return this.tenantsService.createTenantWithAdmin({
      tenantId: dto.tenantId,
      name: dto.name,
      sector: dto.sector,
      country: dto.country,
      city: dto.city,
      currency: dto.currency,
      adminFirstName: dto.adminFirstName,
      adminLastName: dto.adminLastName,
      adminEmail: dto.adminEmail,
      adminPhone: dto.adminPhone,
      adminPassword: dto.adminPassword,
    });
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getMyTenant(@Req() req: AuthRequest) {
    const tenantId = req.user?.tenantId;
    const role = req.user?.role;

    if (!tenantId) {
      throw new ForbiddenException('Tenant no asignado');
    }

    if (!hasRole(role, [Role.Admin, Role.Superadmin])) {
      throw new ForbiddenException(
        'No tienes permisos para ver los datos del tenant',
      );
    }

    return this.tenantsService.getTenantOrThrow(tenantId);
  }

  @Put('me')
  @UseGuards(AuthGuard('jwt'))
  async updateMyTenant(
    @Req() req: AuthRequest,
    @Body() dto: UpdateTenantProfileDto,
  ) {
    const tenantId = req.user?.tenantId;
    const role = req.user?.role;

    if (!tenantId) {
      throw new ForbiddenException('Tenant no asignado');
    }

    if (!hasRole(role, [Role.Admin, Role.Superadmin])) {
      throw new ForbiddenException(
        'No tienes permisos para editar los datos del tenant',
      );
    }

    return this.tenantsService.updateTenantProfile(tenantId, {
      name: dto.name,
      sector: dto.sector,
      country: dto.country,
      city: dto.city,
      address: dto.address,
      openingTime: dto.openingTime,
      closingTime: dto.closingTime,
      appointmentDuration: dto.appointmentDuration,
      language: dto.language,
      currency: dto.currency,
      logoUrl: dto.logoUrl,
      coverUrl: dto.coverUrl,
      aiPromptCustomer: dto.aiPromptCustomer,
      aiPromptSupport: dto.aiPromptSupport,
      aiPromptInternal: dto.aiPromptInternal,
      mercadoPagoPublicKey: dto.mercadoPagoPublicKey,
      mercadoPagoAccessToken: dto.mercadoPagoAccessToken,
      openaiApiKey: dto.openaiApiKey,
      aiModel: dto.aiModel,
      tablesCount: dto.tablesCount,
      capacity: dto.capacity,
    });
  }

  @Delete('cleanup')
  @UseGuards(AuthGuard('jwt'))
  async cleanupTestTenants(@Req() req: AuthRequest) {
    const role = req.user?.role;
    if (!hasRole(role, [Role.Superadmin])) {
      throw new ForbiddenException('Solo superadmin puede limpiar tenants');
    }
    return this.tenantsService.cleanupTestTenants();
  }
}
