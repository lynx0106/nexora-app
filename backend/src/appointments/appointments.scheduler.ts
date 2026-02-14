import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { MailService } from '../mail/mail.service';
import { Tenant } from '../tenants/entities/tenant.entity';

@Injectable()
export class AppointmentsScheduler {
  private readonly logger = new Logger(AppointmentsScheduler.name);

  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    private mailService: MailService,
  ) {}

  // Run every 15 minutes
  @Cron('0 */15 * * * *') // Run every 15 minutes
  async handleReminders() {
    this.logger.debug('Checking for appointment reminders...');

    await this.send24HourReminders();
    await this.send2HourReminders();
  }

  private async send24HourReminders() {
    // Window: 24h from now, +/- 15 mins buffer roughly, but better to check future range
    // We want appointments starting between now+23.5h and now+24.5h that haven't been sent?
    // Or simpler: Appointments starting between (now + 24h) and (now + 24h + 20min)
    // Actually, safer is: Appointments where dateTime < (now + 24h + 15m) AND dateTime > (now + 23h) AND reminderSent24h = false

    const now = new Date();
    const startWindow = new Date(now.getTime() + 23 * 60 * 60 * 1000); // 23 hours from now
    const endWindow = new Date(now.getTime() + 25 * 60 * 60 * 1000); // 25 hours from now (broad window to catch any missed)

    const appointments = await this.appointmentsRepository.find({
      where: {
        dateTime: Between(startWindow, endWindow),
        reminderSent24h: false,
        status: 'confirmed', // Only confirmed appointments
      },
      relations: ['client', 'doctor', 'service', 'tenant'],
    });

    if (appointments.length > 0) {
      this.logger.log(`Found ${appointments.length} appointments for 24h reminder.`);
    }

    for (const appointment of appointments) {
      try {
        await this.mailService.sendAppointmentReminder(appointment, appointment.tenant, '24h');
        appointment.reminderSent24h = true;
        await this.appointmentsRepository.save(appointment);
      } catch (error) {
        this.logger.error(`Failed to send 24h reminder for appointment ${appointment.id}`, error);
      }
    }
  }

  private async send2HourReminders() {
    // Window: Appointments starting between (now + 1h) and (now + 2.5h) AND reminderSent2h = false
    const now = new Date();
    const startWindow = new Date(now.getTime() + 1 * 60 * 60 * 1000); // 1 hour from now
    const endWindow = new Date(now.getTime() + 2.5 * 60 * 60 * 1000); // 2.5 hours from now

    const appointments = await this.appointmentsRepository.find({
      where: {
        dateTime: Between(startWindow, endWindow),
        reminderSent2h: false,
        status: 'confirmed',
      },
      relations: ['client', 'doctor', 'service', 'tenant'],
    });

    if (appointments.length > 0) {
      this.logger.log(`Found ${appointments.length} appointments for 2h reminder.`);
    }

    for (const appointment of appointments) {
      try {
        await this.mailService.sendAppointmentReminder(appointment, appointment.tenant, '2h');
        appointment.reminderSent2h = true;
        await this.appointmentsRepository.save(appointment);
      } catch (error) {
        this.logger.error(`Failed to send 2h reminder for appointment ${appointment.id}`, error);
      }
    }
  }
}
