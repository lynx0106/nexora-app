import {
  Body,
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { InvitationsService } from './invitations.service';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';
import { Role, hasRole } from '../common/constants/roles';
import { Permission } from '../common/constants/permissions';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@Controller('invites')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @Post('tenant/:tenantId')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @RequirePermissions(Permission.InvitationCreate)
  async createInvitation(
    @Param('tenantId') tenantId: string,
    @Body() dto: CreateInvitationDto,
    @Req() req: Request & { user?: any },
  ) {
    const user = req.user;

    if (!hasRole(user?.role, [Role.Admin, Role.Superadmin])) {
      throw new ForbiddenException('No tienes permisos para invitar');
    }

    if (!hasRole(user?.role, [Role.Superadmin]) && user?.tenantId !== tenantId) {
      throw new ForbiddenException('No tienes permiso para otro tenant');
    }

    return this.invitationsService.createInvitation(
      tenantId,
      dto,
      user?.userId || user?.sub || user?.id,
      user?.role,
    );
  }

  @Post('accept')
  async acceptInvitation(@Body() dto: AcceptInvitationDto) {
    return this.invitationsService.acceptInvitation(dto);
  }
}
