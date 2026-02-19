import { Test, TestingModule } from '@nestjs/testing';
import { AppointmentsService } from './appointments.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { Repository } from 'typeorm';
import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';
import { ProductsService } from '../products/products.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let appointmentRepo: jest.Mocked<Repository<Appointment>>;
  let mailService: jest.Mocked<MailService>;
  let usersService: jest.Mocked<UsersService>;
  let tenantsService: jest.Mocked<TenantsService>;
  let productsService: jest.Mocked<ProductsService>;
  let notificationsService: jest.Mocked<NotificationsService>;

  const mockAppointment = {
    id: 'appointment-123',
    tenantId: 'tenant-123',
    clientId: 'client-123',
    doctorId: 'doctor-123',
    serviceId: 'service-123',
    dateTime: new Date('2024-12-15T10:00:00'),
    status: 'pending',
    notes: 'Test appointment',
    client: { id: 'client-123', firstName: 'Client', lastName: 'Test' },
    doctor: { id: 'doctor-123', firstName: 'Doctor', lastName: 'Test' },
    service: { id: 'service-123', name: 'Test Service', duration: 60 },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTenant = {
    id: 'tenant-123',
    name: 'Test Tenant',
    sector: 'restaurant',
  };

  const mockService = {
    id: 'service-123',
    name: 'Test Service',
    duration: 60,
    price: 100,
    tenantId: 'tenant-123',
  };

  beforeEach(async () => {
    const mockAppointmentRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        leftJoinAndMapOne: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockAppointment]),
        getOne: jest.fn().mockResolvedValue(mockAppointment),
      })),
    };

    const mockMailService = {
      sendAppointmentConfirmation: jest.fn().mockResolvedValue(undefined),
    };

    const mockUsersService = {
      findOne: jest.fn().mockResolvedValue(mockAppointment.client),
    };

    const mockTenantsService = {
      findOne: jest.fn().mockResolvedValue(mockTenant),
    };

    const mockProductsService = {
      findOne: jest.fn().mockResolvedValue(mockService),
    };

    const mockNotificationsService = {
      createAndBroadcast: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: getRepositoryToken(Appointment), useValue: mockAppointmentRepo },
        { provide: MailService, useValue: mockMailService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: TenantsService, useValue: mockTenantsService },
        { provide: ProductsService, useValue: mockProductsService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    appointmentRepo = module.get(getRepositoryToken(Appointment));
    mailService = module.get(MailService);
    usersService = module.get(UsersService);
    tenantsService = module.get(TenantsService);
    productsService = module.get(ProductsService);
    notificationsService = module.get(NotificationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create an appointment successfully', async () => {
      const createDto = {
        tenantId: 'tenant-123',
        clientId: 'client-123',
        doctorId: 'doctor-123',
        serviceId: 'service-123',
        dateTime: new Date('2024-12-15T10:00:00'),
        notes: 'Test appointment',
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]), // No overlapping appointments
      };

      productsService.findOne.mockResolvedValue(mockService as any);
      appointmentRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);
      appointmentRepo.create.mockReturnValue(mockAppointment as any);
      appointmentRepo.save.mockResolvedValue(mockAppointment as any);
      appointmentRepo.findOne.mockResolvedValue(mockAppointment as any);
      tenantsService.findOne.mockResolvedValue(mockTenant as any);

      const result = await service.create(createDto);

      expect(result).toBeDefined();
      expect(appointmentRepo.create).toHaveBeenCalledWith(createDto);
      expect(appointmentRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if service not found', async () => {
      const createDto = {
        tenantId: 'tenant-123',
        serviceId: 'nonexistent',
        dateTime: new Date(),
      };

      productsService.findOne.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException for doctor schedule conflict', async () => {
      const createDto = {
        tenantId: 'tenant-123',
        doctorId: 'doctor-123',
        serviceId: 'service-123',
        dateTime: new Date('2024-12-15T10:00:00'),
      };

      const existingAppointment = {
        ...mockAppointment,
        dateTime: new Date('2024-12-15T10:30:00'),
        service: { duration: 60 },
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([existingAppointment]),
      };

      productsService.findOne.mockResolvedValue(mockService as any);
      appointmentRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });

    it('should throw ConflictException for client double booking', async () => {
      const createDto = {
        tenantId: 'tenant-123',
        clientId: 'client-123',
        serviceId: 'service-123',
        dateTime: new Date('2024-12-15T10:00:00'),
      };

      const existingAppointment = {
        ...mockAppointment,
        clientId: 'client-123',
        dateTime: new Date('2024-12-15T10:30:00'),
        service: { duration: 60 },
      };

      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([existingAppointment]),
      };

      productsService.findOne.mockResolvedValue(mockService as any);
      appointmentRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      await expect(service.create(createDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return an appointment by id', async () => {
      appointmentRepo.findOne.mockResolvedValue(mockAppointment as any);

      const result = await service.findOne('appointment-123');

      expect(result).toEqual(mockAppointment);
      expect(appointmentRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'appointment-123' },
        relations: ['doctor', 'client', 'service'],
      });
    });

    it('should return null if appointment not found', async () => {
      appointmentRepo.findOne.mockResolvedValue(null);

      const result = await service.findOne('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findAllByTenant', () => {
    it('should return all appointments for a tenant', async () => {
      appointmentRepo.find.mockResolvedValue([mockAppointment] as any);

      const result = await service.findAllByTenant('tenant-123');

      expect(result).toEqual([mockAppointment]);
      expect(appointmentRepo.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123' },
        relations: ['doctor', 'client', 'service'],
        order: { dateTime: 'ASC' },
      });
    });
  });

  describe('findAllByTenantAndUser', () => {
    it('should return all appointments for a tenant and user', async () => {
      appointmentRepo.find.mockResolvedValue([mockAppointment] as any);

      const result = await service.findAllByTenantAndUser('tenant-123', 'client-123');

      expect(result).toEqual([mockAppointment]);
      expect(appointmentRepo.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123', clientId: 'client-123' },
        relations: ['doctor', 'client', 'service'],
        order: { dateTime: 'DESC' },
      });
    });
  });

  describe('findAllByDoctor', () => {
    it('should return all appointments for a doctor', async () => {
      appointmentRepo.find.mockResolvedValue([mockAppointment] as any);

      const result = await service.findAllByDoctor('doctor-123');

      expect(result).toEqual([mockAppointment]);
      expect(appointmentRepo.find).toHaveBeenCalledWith({
        where: { doctorId: 'doctor-123' },
        relations: ['client', 'service'],
        order: { dateTime: 'ASC' },
      });
    });
  });

  describe('updateStatus', () => {
    it('should update appointment status', async () => {
      const updatedAppointment = { ...mockAppointment, status: 'confirmed' };
      appointmentRepo.update.mockResolvedValue({ affected: 1 } as any);
      appointmentRepo.findOne.mockResolvedValue(updatedAppointment as any);

      const result = await service.updateStatus('appointment-123', 'confirmed');

      expect(result?.status).toBe('confirmed');
      expect(appointmentRepo.update).toHaveBeenCalledWith('appointment-123', {
        status: 'confirmed',
      });
    });
  });

  describe('update', () => {
    it('should update appointment data', async () => {
      const updateData = { notes: 'Updated notes' };
      const updatedAppointment = { ...mockAppointment, ...updateData };
      appointmentRepo.update.mockResolvedValue({ affected: 1 } as any);
      appointmentRepo.findOne.mockResolvedValue(updatedAppointment as any);

      const result = await service.update('appointment-123', updateData);

      expect(result?.notes).toBe('Updated notes');
      expect(appointmentRepo.update).toHaveBeenCalledWith('appointment-123', updateData);
    });
  });

  describe('remove', () => {
    it('should delete an appointment', async () => {
      appointmentRepo.delete.mockResolvedValue({ affected: 1 } as any);

      const result = await service.remove('appointment-123');

      expect(result).toEqual({ deleted: true });
      expect(appointmentRepo.delete).toHaveBeenCalledWith('appointment-123');
    });
  });

  describe('removeAllByTenant', () => {
    it('should delete all appointments for a tenant', async () => {
      appointmentRepo.delete.mockResolvedValue({ affected: 5 } as any);

      const result = await service.removeAllByTenant('tenant-123');

      expect(result).toBeDefined();
      expect(appointmentRepo.delete).toHaveBeenCalledWith({ tenantId: 'tenant-123' });
    });
  });

  describe('getDashboardStats', () => {
    it('should return dashboard statistics', async () => {
      appointmentRepo.count
        .mockResolvedValueOnce(5) // todayCount
        .mockResolvedValueOnce(3); // pendingCount

      const result = await service.getDashboardStats('tenant-123');

      expect(result.todayCount).toBe(5);
      expect(result.pendingCount).toBe(3);
    });

    it('should filter by user when provided', async () => {
      appointmentRepo.count
        .mockResolvedValueOnce(2)
        .mockResolvedValueOnce(1);

      const result = await service.getDashboardStats('tenant-123', 'client-123');

      expect(result).toBeDefined();
    });
  });

  describe('findRecent', () => {
    it('should return recent appointments', async () => {
      appointmentRepo.find.mockResolvedValue([mockAppointment] as any);

      const result = await service.findRecent('tenant-123', 10);

      expect(result).toEqual([mockAppointment]);
      expect(appointmentRepo.find).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        }),
      );
    });
  });

  describe('findByDateRange', () => {
    it('should return appointments within date range', async () => {
      appointmentRepo.find.mockResolvedValue([mockAppointment] as any);

      const start = new Date('2024-12-01');
      const end = new Date('2024-12-31');
      const result = await service.findByDateRange('tenant-123', start, end);

      expect(result).toBeDefined();
      expect(appointmentRepo.find).toHaveBeenCalled();
    });
  });

  describe('findForReport', () => {
    it('should return appointments for report', async () => {
      appointmentRepo.find.mockResolvedValue([mockAppointment] as any);

      const start = new Date('2024-12-01');
      const end = new Date('2024-12-31');
      const result = await service.findForReport('tenant-123', start, end);

      expect(result).toBeDefined();
    });

    it('should filter by user when provided', async () => {
      appointmentRepo.find.mockResolvedValue([mockAppointment] as any);

      const start = new Date('2024-12-01');
      const end = new Date('2024-12-31');
      const result = await service.findForReport('tenant-123', start, end, 'client-123');

      expect(result).toBeDefined();
    });
  });
});
