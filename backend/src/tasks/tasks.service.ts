import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppointmentsService } from '../appointments/appointments.service';
import { InvitationsService } from '../invitations/invitations.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly appointmentsService: AppointmentsService,
    private readonly invitationsService: InvitationsService,
    private readonly authService: AuthService,
  ) {}

  /**
   * Run all scheduled tasks manually
   * This can be called from the API endpoint
   */
  async runAllTasks() {
    const results: any = {};

    try {
      await this.appointmentsService.sendReminders();
      results.appointments = 'completed';
      this.logger.log('Appointment reminders sent successfully');
    } catch (error) {
      this.logger.error('Appointment reminders failed:', error);
      results.appointments = 'failed';
    }

    try {
      await this.invitationsService.markExpiredInvitations();
      results.invitations = 'completed';
      this.logger.log('Invitation cleanup completed');
    } catch (error) {
      this.logger.error('Invitation cleanup failed:', error);
      results.invitations = 'failed';
    }

    try {
      await this.authService.cleanupExpiredTokens();
      results.tokens = 'completed';
      this.logger.log('Token cleanup completed');
    } catch (error) {
      this.logger.error('Token cleanup failed:', error);
      results.tokens = 'failed';
    }

    return results;
  }

  /**
   * Cron job: Send appointment reminders
   * Runs every hour at minute 0
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleAppointmentReminders() {
    this.logger.log('Running scheduled task: Appointment reminders');
    try {
      await this.appointmentsService.sendReminders();
      this.logger.log('Appointment reminders sent successfully');
    } catch (error) {
      this.logger.error('Failed to send appointment reminders:', error);
    }
  }

  /**
   * Cron job: Cleanup expired invitations and tokens
   * Runs every day at 2:00 AM
   */
  @Cron('0 2 * * *')
  async handleCleanup() {
    this.logger.log('Running scheduled task: Cleanup');
    try {
      await this.invitationsService.markExpiredInvitations();
      this.logger.log('Invitation cleanup completed');
    } catch (error) {
      this.logger.error('Failed to cleanup invitations:', error);
    }

    try {
      await this.authService.cleanupExpiredTokens();
      this.logger.log('Token cleanup completed');
    } catch (error) {
      this.logger.error('Failed to cleanup tokens:', error);
    }
  }
}
