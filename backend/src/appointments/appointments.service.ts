import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';
import { ProductsService } from '../products/products.service';
import { Tenant } from '../tenants/entities/tenant.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    private mailService: MailService,
    private usersService: UsersService,
    private tenantsService: TenantsService,
    private notificationsService: NotificationsService,
    private productsService: ProductsService,
  ) {}

  async create(createAppointmentDto: CreateAppointmentDto) {
    // Handle optional fields that might come as empty strings
    if (createAppointmentDto.doctorId === '') {
      delete createAppointmentDto.doctorId;
    }

    // --- Validation: Check for Overlapping Appointments ---
    if (createAppointmentDto.serviceId) {
      const service = await this.productsService.findOne(createAppointmentDto.serviceId, createAppointmentDto.tenantId);
      if (!service) {
        throw new NotFoundException('Servicio/Producto no encontrado');
      }

      const duration = service.duration || 60; // Default to 60 mins if not set (safer default for main slots)
      const newStart = new Date(createAppointmentDto.dateTime);
      const newEnd = new Date(newStart.getTime() + duration * 60000);

      // 1. Check Doctor Availability (if doctor assigned)
      if (createAppointmentDto.doctorId) {
        const overlappingDocs = await this.appointmentsRepository.createQueryBuilder('appt')
          .leftJoinAndSelect('appt.service', 'service')
          .where('appt.doctorId = :doctorId', { doctorId: createAppointmentDto.doctorId })
          .andWhere('appt.status != :cancelled', { cancelled: 'cancelled' })
          .andWhere('appt.dateTime < :newEnd', { newEnd }) // Optimization: Start must be before New End
          .getMany();

        const hasDocOverlap = overlappingDocs.some(existing => {
          const existingDuration = existing.service?.duration || 60;
          const existingStart = new Date(existing.dateTime);
          const existingEnd = new Date(existingStart.getTime() + existingDuration * 60000);
          // Overlap if: (StartA < EndB) and (EndA > StartB)
          // We already filtered StartA < EndB in SQL.
          return existingEnd > newStart;
        });

        if (hasDocOverlap) {
          throw new ConflictException('El especialista ya tiene una cita agendada en ese horario (conflicto de agenda).');
        }
      }

      // 2. Check Client Availability (prevent double booking for same client)
      if (createAppointmentDto.clientId) {
        const overlappingClients = await this.appointmentsRepository.createQueryBuilder('appt')
          .leftJoinAndSelect('appt.service', 'service')
          .where('appt.clientId = :clientId', { clientId: createAppointmentDto.clientId })
          .andWhere('appt.status != :cancelled', { cancelled: 'cancelled' })
          .andWhere('appt.dateTime < :newEnd', { newEnd })
          .getMany();

        const hasClientOverlap = overlappingClients.some(existing => {
          const existingDuration = existing.service?.duration || 60;
          const existingStart = new Date(existing.dateTime);
          const existingEnd = new Date(existingStart.getTime() + existingDuration * 60000);
          return existingEnd > newStart;
        });

        if (hasClientOverlap) {
          throw new ConflictException('El cliente ya tiene una reserva/cita activa en ese horario.');
        }
      }
    }
    // -----------------------------------------------------

    const appointment =
      this.appointmentsRepository.create(createAppointmentDto);
    const savedAppointment =
      await this.appointmentsRepository.save(appointment);

    // Send Notification
    try {
      const fullAppointment = await this.findOne(savedAppointment.id); // Reload to get relations
      const tenant = await this.tenantsService.findOne(
        savedAppointment.tenantId,
      );

      if (fullAppointment && tenant) {
        // Send Email
        await this.mailService.sendAppointmentConfirmation(
          fullAppointment,
          tenant,
        );

        // Check for special occasion and notify
        const occasion = (fullAppointment as any).occasion;
        if (occasion && occasion !== 'Ninguna / Casual') {
          await this.notificationsService.createAndBroadcast({
            tenantId: savedAppointment.tenantId,
            title: `¡Ocasión Especial: ${occasion}!`,
            message: `Nueva reserva de ${fullAppointment.client?.firstName || 'Cliente'} para ${occasion}.`,
            type: 'warning', // Use warning or distinct type for emphasis
            link: '/dashboard/agenda',
          });
        }

        // Send In-App Notification
        const isRestaurant = (tenant.sector || '')
          .toLowerCase()
          .includes('restaurante');
        const typeLabel = isRestaurant ? 'Reserva' : 'Cita';
        const staffLabel = isRestaurant
          ? fullAppointment.doctor
            ? `con ${fullAppointment.doctor.firstName}`
            : ''
          : `con ${fullAppointment.doctor?.firstName || 'Especialista'}`;

        await this.notificationsService.createAndBroadcast({
          tenantId: savedAppointment.tenantId,
          title: `Nueva ${typeLabel}`,
          message: `Nueva ${typeLabel.toLowerCase()} agendada para ${fullAppointment.client?.firstName || 'Cliente'} ${staffLabel}.`,
          type: 'info',
          link: '/dashboard/agenda', // Updated link to be consistent
        });
      }
    } catch (e) {
      this.logger.error('Error sending appointment notification:', e);
    }

    return savedAppointment;
  }

  findAllGlobal() {
    return this.appointmentsRepository.createQueryBuilder('appointment')
      .leftJoinAndMapOne('appointment.tenant', Tenant, 'tenant', 'tenant.id = appointment.tenantId')
      .leftJoinAndSelect('appointment.doctor', 'doctor')
      .leftJoinAndSelect('appointment.client', 'client')
      .leftJoinAndSelect('appointment.service', 'service')
      .orderBy('appointment.dateTime', 'DESC')
      .getMany();
  }

  findAllByTenant(tenantId: string) {
    return this.appointmentsRepository.find({
      where: { tenantId },
      relations: ['doctor', 'client', 'service'],
      order: { dateTime: 'ASC' },
    });
  }

  findAllByTenantAndUser(tenantId: string, userId: string) {
    return this.appointmentsRepository.find({
      where: { tenantId, clientId: userId },
      relations: ['doctor', 'client', 'service'],
      order: { dateTime: 'DESC' },
    });
  }

  findRecent(tenantId: string, limit: number, userId?: string) {
    const where: any = { tenantId };
    if (userId) where.clientId = userId;

    return this.appointmentsRepository.find({
      where,
      relations: ['client', 'service'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async findForReport(
    tenantId: string,
    start: Date,
    end: Date,
    userId?: string,
  ) {
    const where: any = {
      tenantId,
      dateTime: Between(start, end),
    };

    if (userId) {
      where.clientId = userId;
    }

    return this.appointmentsRepository.find({
      where,
      relations: ['doctor', 'client', 'service'],
      order: { dateTime: 'DESC' },
    });
  }

  async findByDateRange(tenantId: string, startDate: Date, endDate: Date) {
    return this.appointmentsRepository.find({
      where: {
        tenantId,
        dateTime: Between(startDate, endDate),
      },
    });
  }

  async getDashboardStats(tenantId: string, userId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const whereToday: any = {
      tenantId,
      dateTime: Between(today, tomorrow),
    };
    const wherePending: any = {
      tenantId,
      status: 'pending',
    };

    if (userId) {
      whereToday.clientId = userId;
      wherePending.clientId = userId;
    }

    const [todayCount, pendingCount] = await Promise.all([
      this.appointmentsRepository.count({
        where: whereToday,
      }),
      this.appointmentsRepository.count({
        where: wherePending,
      }),
    ]);

    return {
      todayCount,
      pendingCount,
    };
  }

  async findOne(id: string) {
    return this.appointmentsRepository.findOne({
      where: { id },
      relations: ['doctor', 'client', 'service'],
    });
  }

  findAllByDoctor(doctorId: string) {
    return this.appointmentsRepository.find({
      where: { doctorId },
      relations: ['client', 'service'],
      order: { dateTime: 'ASC' },
    });
  }

  async updateStatus(id: string, status: string) {
    await this.appointmentsRepository.update(id, { status });
    return this.appointmentsRepository.findOne({
      where: { id },
      relations: ['doctor', 'client', 'service'],
    });
  }

  async update(id: string, updateData: any) {
    await this.appointmentsRepository.update(id, updateData);
    return this.appointmentsRepository.findOne({
      where: { id },
      relations: ['doctor', 'client', 'service'],
    });
  }

  async remove(id: string) {
    await this.appointmentsRepository.delete(id);
    return { deleted: true };
  }

  async removeAllByTenant(tenantId: string) {
    return this.appointmentsRepository.delete({ tenantId });
  }
}
