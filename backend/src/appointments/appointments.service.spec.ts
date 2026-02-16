import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './entities/appointment.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { User } from '../users/entities/user.entity';

describe('AppointmentsService', () => {
  let service: AppointmentsService;
  let appointmentsRepository: Repository<Appointment>;
  let tenantsRepository: Repository<Tenant>;
  let usersRepository: Repository<User>;

  const mockAppointment: Appointment = {
    id: 'appointment-uuid-1',
    customerName: 'Juan Pérez',
    customerEmail: 'juan@example.com',
    customerPhone: '+573001234567',
    serviceName: 'Limpieza Dental',
    servicePrice: 80000,
    date: new Date('2026-02-20'),
    time: '10:00',
    status: 'pending',
    notes: 'Primera visita',
    tenantId: 'tenant-uuid-1',
    professionalId: 'doctor-uuid-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockAppointmentsRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getOne: jest.fn(),
    })),
  };

  const mockTenantsRepository = {
    findOne: jest.fn(),
  };

  const mockUsersRepository = {
    findOne: jest.fn(),
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
          provide: getRepositoryToken(Tenant),
          useValue: mockTenantsRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    service = module.get<AppointmentsService>(AppointmentsService);
    appointmentsRepository = module.get<Repository<Appointment>>(getRepositoryToken(Appointment));
    tenantsRepository = module.get<Repository<Tenant>>(getRepositoryToken(Tenant));
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('debería retornar todas las citas del tenant', async () => {
      const appointments = [mockAppointment];
      mockAppointmentsRepository.find.mockResolvedValue(appointments);

      const result = await service.findAll('tenant-uuid-1');

      expect(result).toEqual(appointments);
      expect(mockAppointmentsRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-uuid-1' },
        order: { date: 'ASC', time: 'ASC' },
      });
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

  describe('findByDate', () => {
    it('debería retornar citas por fecha', async () => {
      const appointments = [mockAppointment];
      mockAppointmentsRepository.find.mockResolvedValue(appointments);

      const result = await service.findByDate('tenant-uuid-1', new Date('2026-02-20'));

      expect(result).toEqual(appointments);
    });
  });

  describe('create', () => {
    it('debería crear cita exitosamente', async () => {
      const createData = {
        customerName: 'María García',
        customerEmail: 'maria@example.com',
        customerPhone: '+573009876543',
        serviceName: 'Blanqueamiento',
        servicePrice: 150000,
        date: new Date('2026-02-21'),
        time: '14:00',
        tenantId: 'tenant-uuid-1',
        professionalId: 'doctor-uuid-1',
      };

      mockAppointmentsRepository.create.mockReturnValue({ ...mockAppointment, ...createData });
      mockAppointmentsRepository.save.mockResolvedValue({ ...mockAppointment, ...createData });

      const result = await service.create(createData);

      expect(result.customerName).toBe('María García');
      expect(mockAppointmentsRepository.save).toHaveBeenCalled();
    });

    it('debería lanzar error si falta información requerida', async () => {
      await expect(
        service.create({
          customerName: '',
          serviceName: '',
          date: null as any,
          time: '',
          tenantId: 'tenant-uuid-1',
        }),
      ).rejects.toThrow();
    });

    it('debería lanzar error si el horario no está disponible', async () => {
      mockAppointmentsRepository.findOne.mockResolvedValue(mockAppointment);

      await expect(
        service.create({
          customerName: 'Test',
          customerEmail: 'test@test.com',
          serviceName: 'Service',
          servicePrice: 100,
          date: new Date('2026-02-20'),
          time: '10:00',
          tenantId: 'tenant-uuid-1',
          professionalId: 'doctor-uuid-1',
        }),
      ).rejects.toThrow('El horario no está disponible');
    });
  });

  describe('update', () => {
    it('debería actualizar cita exitosamente', async () => {
      const updatedAppointment = { ...mockAppointment, status: 'confirmed' };
      mockAppointmentsRepository.findOne.mockResolvedValue(mockAppointment);
      mockAppointmentsRepository.save.mockResolvedValue(updatedAppointment);

      const result = await service.update('appointment-uuid-1', {
        status: 'confirmed',
      });

      expect(result.status).toBe('confirmed');
    });

    it('debería lanzar error si la cita no existe', async () => {
      mockAppointmentsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('noexistent', { status: 'confirmed' }),
      ).rejects.toThrow('Cita no encontrada');
    });
  });

  describe('cancel', () => {
    it('debería cancelar cita exitosamente', async () => {
      const cancelledAppointment = { ...mockAppointment, status: 'cancelled' };
      mockAppointmentsRepository.findOne.mockResolvedValue(mockAppointment);
      mockAppointmentsRepository.save.mockResolvedValue(cancelledAppointment);

      const result = await service.cancel('appointment-uuid-1');

      expect(result.status).toBe('cancelled');
    });

    it('debería lanzar error si la cita ya está cancelada', async () => {
      mockAppointmentsRepository.findOne.mockResolvedValue({
        ...mockAppointment,
        status: 'cancelled',
      });

      await expect(service.cancel('appointment-uuid-1')).rejects.toThrow(
        'La cita ya está cancelada',
      );
    });
  });

  describe('remove', () => {
    it('debería eliminar cita exitosamente', async () => {
      mockAppointmentsRepository.findOne.mockResolvedValue(mockAppointment);
      mockAppointmentsRepository.delete.mockResolvedValue({ affected: 1, raw: [] });

      await expect(service.remove('appointment-uuid-1')).resolves.not.toThrow();
    });

    it('debería lanzar error si la cita no existe', async () => {
      mockAppointmentsRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('noexistent')).rejects.toThrow('Cita no encontrada');
    });
  });

  describe('getAvailableSlots', () => {
    it('debería retornar horarios disponibles', async () => {
      mockTenantsRepository.findOne.mockResolvedValue({
        id: 'tenant-uuid-1',
        openingTime: '09:00',
        closingTime: '18:00',
        appointmentDuration: 60,
      });
      mockAppointmentsRepository.find.mockResolvedValue([mockAppointment]);

      const result = await service.getAvailableSlots(
        'tenant-uuid-1',
        new Date('2026-02-20'),
        'doctor-uuid-1',
      );

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
