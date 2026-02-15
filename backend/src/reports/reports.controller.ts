import {
  Controller,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
  ForbiddenException,
  BadRequestException,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ReportsService } from './reports.service';
import { Role, hasRole } from '../common/constants/roles';

@Controller('reports')
@UseGuards(AuthGuard('jwt'))
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('tenant/:tenantId/orders')
  async exportOrders(
    @Param('tenantId') tenantId: string,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('format') format: string | undefined,
    @Req() req: Request & { user?: any },
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user;
    if (!user?.tenantId) {
      throw new ForbiddenException('Usuario no identificado');
    }

    if (!hasRole(user.role, [Role.Superadmin]) && user.tenantId !== tenantId) {
      throw new ForbiddenException('No tienes permiso para exportar este tenant');
    }

    const isUser = hasRole(user.role, [Role.User]);
    const userId = isUser ? (user.userId || user.sub || user.id) : undefined;

    const report = await this.reportsService.getOrdersReport(tenantId, from, to, userId);
    return this.reportsService.respondWithFormat(
      res,
      report,
      format,
      `orders-${tenantId}`,
    );
  }

  @Get('tenant/:tenantId/appointments')
  async exportAppointments(
    @Param('tenantId') tenantId: string,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('format') format: string | undefined,
    @Req() req: Request & { user?: any },
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user;
    if (!user?.tenantId) {
      throw new ForbiddenException('Usuario no identificado');
    }

    if (!hasRole(user.role, [Role.Superadmin]) && user.tenantId !== tenantId) {
      throw new ForbiddenException('No tienes permiso para exportar este tenant');
    }

    const isUser = hasRole(user.role, [Role.User]);
    const userId = isUser ? (user.userId || user.sub || user.id) : undefined;

    const report = await this.reportsService.getAppointmentsReport(
      tenantId,
      from,
      to,
      userId,
    );
    return this.reportsService.respondWithFormat(
      res,
      report,
      format,
      `appointments-${tenantId}`,
    );
  }

  @Get('tenant/:tenantId/users')
  async exportUsers(
    @Param('tenantId') tenantId: string,
    @Query('from') from: string | undefined,
    @Query('to') to: string | undefined,
    @Query('format') format: string | undefined,
    @Req() req: Request & { user?: any },
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = req.user;
    if (!user?.tenantId) {
      throw new ForbiddenException('Usuario no identificado');
    }

    if (!hasRole(user.role, [Role.Superadmin, Role.Admin])) {
      throw new ForbiddenException('No tienes permisos para exportar usuarios');
    }

    if (!hasRole(user.role, [Role.Superadmin]) && user.tenantId !== tenantId) {
      throw new ForbiddenException('No tienes permiso para exportar este tenant');
    }

    const report = await this.reportsService.getUsersReport(tenantId, from, to);
    return this.reportsService.respondWithFormat(
      res,
      report,
      format,
      `users-${tenantId}`,
    );
  }

  @Get('health')
  healthCheck() {
    return { status: 'ok' };
  }

  @Get('formats')
  formats() {
    return { formats: ['csv', 'json'] };
  }

  @Get('help')
  help() {
    throw new BadRequestException('Usa /reports/tenant/:tenantId/{orders|appointments|users}');
  }
}
