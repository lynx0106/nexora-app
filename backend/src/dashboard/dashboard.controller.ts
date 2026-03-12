import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('activity/:tenantId')
  async getActivity(@Param('tenantId') tenantId: string, @Req() req: Request) {
    const user = req.user!;
    const userId = user.role === 'user' ? user.userId : undefined;
    return this.dashboardService.getRecentActivity(tenantId, userId);
  }

  @Get('charts/sales/:tenantId')
  async getSalesChart(@Param('tenantId') tenantId: string) {
    return this.dashboardService.getSalesChart(tenantId);
  }

  @Get('metrics/:tenantId')
  async getMetrics(@Param('tenantId') tenantId: string, @Req() req: Request) {
    return this.dashboardService.getDashboardByBusinessType(tenantId);
  }
}
