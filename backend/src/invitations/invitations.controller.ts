import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { InvitationsService } from './invitations.service';
import { GenerateInvitationDto } from './dto/generate-invitation.dto';
import { hasRole } from '../common/constants/roles';
import { Role } from '../common/constants/roles';
import { Permission } from '../common/constants/permissions';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@ApiTags('Invitations')
@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post('generate')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions(Permission.UserManage)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generar código de invitación (Admin)' })
  @ApiResponse({
    status: 201,
    description: 'Invitación generada correctamente',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        qrData: '{"type":"nexora-invite","version":1,...}',
        deepLink: 'nexora://invite?id=...',
        webUrl: 'https://nexora-app.online/register?invitationId=...',
        expiresAt: '2024-01-04T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async generate(
    @Body() dto: GenerateInvitationDto,
    @Req() req: Request,
  ) {
    const user = (req as any).user;
    
    if (!user) {
      throw new ForbiddenException('No autorizado');
    }

    // Solo admin y superadmin pueden generar invitaciones
    if (!hasRole(user.role, [Role.Admin, Role.Superadmin])) {
      throw new ForbiddenException('No tienes permiso para generar invitaciones');
    }

    return this.invitationsService.generate(
      dto,
      user.id,
      user.tenantId,
      user.role,
    );
  }

  @Get(':id/validate')
  @ApiOperation({ summary: 'Validar código de invitación' })
  @ApiParam({ name: 'id', description: 'ID de la invitación', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Resultado de la validación',
    schema: {
      example: {
        valid: true,
        invitationId: '550e8400-e29b-41d4-a716-446655440000',
        tenantId: 'restaurante-demo',
        tenantName: 'Restaurante Demo',
        role: 'client',
        expiresAt: '2024-01-04T00:00:00.000Z',
      },
    },
  })
  async validate(@Param('id') id: string) {
    return this.invitationsService.validate(id);
  }

  @Get('tenant/:tenantId')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions(Permission.UserManage)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar invitaciones de un tenant (Admin)' })
  @ApiParam({ name: 'tenantId', description: 'ID del tenant', type: 'string' })
  @ApiResponse({ status: 200, description: 'Lista de invitaciones' })
  @ApiResponse({ status: 401, description: 'No autorizado' })
  @ApiResponse({ status: 403, description: 'Sin permisos' })
  async findByTenant(
    @Param('tenantId') tenantId: string,
    @Req() req: Request,
  ) {
    const user = (req as any).user;

    // Solo admin del mismo tenant o superadmin pueden ver
    if (!hasRole(user.role, [Role.Superadmin]) && user.tenantId !== tenantId) {
      throw new ForbiddenException('No tienes permiso para ver estas invitaciones');
    }

    return this.invitationsService.findByTenant(tenantId);
  }
}
