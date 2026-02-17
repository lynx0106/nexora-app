import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './entities/appointment.entity';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';
import { ProductsService } from '../products/products.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let appointmentsRepository: Repository<Appointment>;

  const mockAppointment: Partial<Appointment> = {
    id: 'appointment-uuid-1',
    dateTime: new Date('2026-02-20T10:00:00'),
    status: 'pending',
    notes: 'Primera visita',
    tenantId: 'tenant-uuid-1',
    doctorId: 'doctor-uuid-1',
    clientId: 'client-uuid-1',
    serviceId: 'service-uuid-1',
    pax: 1,
    reminderSent24h: false,
    reminderSent2h: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAppointmentsRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getOne: jest.fn(),
    })),
  };

  const mockMailService = {
    sendAppointmentConfirmation: jest.fn(),
    sendAppointmentReminder: jest.fn(),
  };

  const mockUsersService = {
    findOne: jest.fn(),
    findByEmail: jest.fn(),
  };

  const mockTenantsService = {
    findOne: jest.fn(),
    getTenantOrThrow: jest.fn(),
  };

  const mockProductsService = {
    findOne: jest.fn(),
    findAllByTenant: jest.fn(),
  };

  const mockNotificationsService = {
    notifyNewAppointment: jest.fn(),
    notifyAppointmentCancelled: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        {
          provide: getRepositoryToken(Appointment),
          useValue: mockAppointmentsRepository,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: TenantsService,
          useValue: mockTenantsService,
        },
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    appointmentsRepository = module.get<Repository<Appointment>>(getRepositoryToken(Appointment));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAllByTenant', () => {
    it('debería retornar todas las citas del tenant', async () => {
      const appointments = [mockAppointment];
      mockAppointmentsRepository.find.mockResolvedValue(appointments);

      const result = await service.findAllByTenant('tenant-uuid-1');

      expect(result).toEqual(appointments);
    });
  });

  describe('findOne', () => {
    it('debería encontrar cita por ID', async () => {
      mockAppointmentsRepository.findOne.mockResolvedValue(mockAppointment);

      const result = await service.findOne('appointment-uuid-1');

      expect(result).toEqual(mockAppointment);
    });

    it('debería retornar null si la cita no existe', async () => {
      mockAppointmentsRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne('noexistent');

      expect(result).toBeNull();
    });
  });

  describe('findAllByDoctor', () => {
    it('debería retornar citas del doctor', async () => {
      const appointments = [mockAppointment];
      mockAppointmentsRepository.find.mockResolvedValue(appointments);

      const result = await service.findAllByDoctor('doctor-uuid-1');

      expect(result).toEqual(appointments);
    });
  });

  describe('updateStatus', () => {
    it('debería actualizar estado de cita', async () => {
      const updatedAppointment = { ...mockAppointment, status: 'confirmed' };
      mockAppointmentsRepository.update.mockResolvedValue({ affected: 1 });
      mockAppointmentsRepository.findOne.mockResolvedValue(updatedAppointment);

      const result = await service.updateStatus('appointment-uuid-1', 'confirmed');

      expect(result.status).toBe('confirmed');
    });
  });

  describe('update', () => {
    it('debería actualizar cita', async () => {
      const updatedAppointment = { ...mockAppointment, notes: 'Notas actualizadas' };
      mockAppointmentsRepository.update.mockResolvedValue({ affected: 1 });
      mockAppointmentsRepository.findOne.mockResolvedValue(updatedAppointment);

      const result = await service.update('appointment-uuid-1', { notes: 'Notas actualizadas' });

      expect(result.notes).toBe('Notas actualizadas');
    });
  });

  describe('remove', () => {
    it('debería eliminar cita exitosamente', async () => {
      mockAppointmentsRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.remove('appointment-uuid-1');

      expect(result.deleted).toBe(true);
    });
  });

  describe('removeAllByTenant', () => {
    it('debería eliminar todas las citas del tenant', async () => {
      mockAppointmentsRepository.delete.mockResolvedValue({ affected: 5 });

      const result = await service.removeAllByTenant('tenant-uuid-1');

      expect(mockAppointmentsRepository.delete).toHaveBeenCalledWith({ tenantId: 'tenant-uuid-1' });
    });
  });

  describe('getDashboardStats', () => {
    it('debería retornar estadísticas del dashboard', async () => {
      mockAppointmentsRepository.count
        .mockResolvedValueOnce(3) // todayCount
        .mockResolvedValueOnce(5); // pendingCount

      const result = await service.getDashboardStats('tenant-uuid-1');

      expect(result.todayCount).toBe(3);
      expect(result.pendingCount).toBe(5);
    });
  });
});
