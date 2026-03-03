import { Controller, Get, Post, Logger, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users/users.service';
import { TenantsService } from './tenants/tenants.service';
import { InvitationsService } from './invitations/invitations.service';
import { AuthService } from './auth/auth.service';
import { AppointmentsService } from './appointments/appointments.service';
import type { Request } from 'express';

@ApiTags('System')
@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
    private readonly invitationsService: InvitationsService,
    private readonly authService: AuthService,
    private readonly appointmentsService: AppointmentsService,
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
  // AUTOMATION ENDPOINTS (for external cron services)
  // ===========================================

  private isValidCronKey(apiKey: string): boolean {
    const cronKey = process.env.CRON_API_KEY;
    return cronKey !== undefined && apiKey === cronKey;
  }

  /**
   * Run all scheduled tasks manually
   * Use: External cron service calls this endpoint
   * Auth: Use header X-CRON-KEY with your API key
   */
  @Post('cron/run-all')
  @ApiOperation({ summary: 'Run all scheduled tasks (appointment reminders, cleanup)' })
  async runAllCronTasks(@Req() req: Request) {
    const apiKey = req.headers['x-cron-key'] as string;
    
    if (!this.isValidCronKey(apiKey)) {
      return { success: false, message: 'Invalid API key' };
    }
    
    const results: any = {};
    
    try {
      await this.appointmentsService.sendReminders();
      results.appointments = 'completed';
    } catch (error) {
      this.logger.error('Appointment reminders failed:', error);
      results.appointments = 'failed';
    }

    try {
      await this.invitationsService.markExpiredInvitations();
      results.invitations = 'completed';
    } catch (error) {
      this.logger.error('Invitation cleanup failed:', error);
      results.invitations = 'failed';
    }

    try {
      await this.authService.cleanupExpiredTokens();
      results.tokens = 'completed';
    } catch (error) {
      this.logger.error('Token cleanup failed:', error);
      results.tokens = 'failed';
    }

    return {
      success: true,
      timestamp: new Date().toISOString(),
      results,
    };
  }

  /**
   * Run only appointment reminders
   */
  @Post('cron/appointments')
  @ApiOperation({ summary: 'Send appointment reminders (24h and 2h before)' })
  async runAppointmentReminders(@Req() req: Request) {
    const apiKey = req.headers['x-cron-key'] as string;
    
    if (!this.isValidCronKey(apiKey)) {
      return { success: false, message: 'Invalid API key' };
    }
    
    await this.appointmentsService.sendReminders();
    return { success: true, message: 'Appointment reminders sent', timestamp: new Date().toISOString() };
  }

  /**
   * Run cleanup tasks
   */
  @Post('cron/cleanup')
  @ApiOperation({ summary: 'Cleanup expired invitations and tokens' })
  async runCleanup(@Req() req: Request) {
    const apiKey = req.headers['x-cron-key'] as string;
    
    if (!this.isValidCronKey(apiKey)) {
      return { success: false, message: 'Invalid API key' };
    }
    
    const invitationsCount = await this.invitationsService.markExpiredInvitations();
    const tokensCount = await this.authService.cleanupExpiredTokens();
    
    return { 
      success: true, 
      expiredInvitations: invitationsCount,
      expiredTokens: tokensCount,
      timestamp: new Date().toISOString() 
    };
  }
}
