import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('activity/:tenantId')
  async getActivity(@Param('tenantId') tenantId: string, @Req() req: any) {
    const user = req.user;
    const userId = user.role === 'user' ? user.id : undefined;
    return this.dashboardService.getRecentActivity(tenantId, userId);
  }

  @Get('charts/sales/:tenantId')
  async getSalesChart(@Param('tenantId') tenantId: string) {
    return this.dashboardService.getSalesChart(tenantId);
  }

  @Get('metrics/:tenantId')
  async getMetrics(@Param('tenantId') tenantId: string, @Req() req: any) {
    return this.dashboardService.getDashboardByBusinessType(tenantId);
  }
}
