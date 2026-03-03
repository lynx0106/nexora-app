import { Controller, Get, Post, Logger, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users/users.service';
import { TenantsService } from './tenants/tenants.service';
import { TasksService } from './tasks/tasks.service';
import type { Request } from 'express';

@ApiTags('System')
@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
    private readonly tasksService: TasksService,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'nexora-api',
    };
  }

  /**
   * Debug endpoint to check if cookies are being received
   */
  @Get('debug-cookies')
  @ApiOperation({ summary: 'Debug cookies - check if they are being received' })
  debugCookies(@Req() req: Request) {
    return {
      cookies: req.cookies,
      headers: {
        origin: req.headers.origin,
        host: req.headers.host,
        referer: req.headers.referer,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // ===========================================
  // AUTOMATION ENDPOINTS (superadmin only)
  // Now handled automatically by @nestjs/schedule - see tasks.service.ts
  // ===========================================

  /**
   * Run all scheduled tasks manually
   * Use: Only superadmin users can trigger this endpoint
   * Auth: JWT token required (superadmin role)
   */
  @Post('cron/run-all')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Run all scheduled tasks manually (appointment reminders, cleanup) - Superadmin only' })
  async runAllCronTasks() {
    const results = await this.tasksService.runAllTasks();
    return {
      success: true,
      timestamp: new Date().toISOString(),
      results,
    };
  }

  /**
   * Run only appointment reminders (superadmin only)
   */
  @Post('cron/appointments')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send appointment reminders manually (24h and 2h before) - Superadmin only' })
  async runAppointmentReminders() {
    await this.tasksService.handleAppointmentReminders();
    return { success: true, message: 'Appointment reminders sent', timestamp: new Date().toISOString() };
  }

  /**
   * Run cleanup tasks manually (superadmin only)
   */
  @Post('cron/cleanup')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cleanup expired invitations and tokens manually - Superadmin only' })
  async runCleanup() {
    await this.tasksService.handleCleanup();
    return {
      success: true,
      message: 'Cleanup completed',
      timestamp: new Date().toISOString()
    };
  }
}
