import { Test, TestingModule } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Tenant } from '../tenants/entities/tenant.entity';
import { Order } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { User } from '../users/entities/user.entity';
import { OrdersService } from '../orders/orders.service';
import { AppointmentsService } from '../appointments/appointments.service';

describe('DashboardService', () => {
  let service: DashboardService;

  const mockOrdersService = {
    findRecent: jest.fn().mockResolvedValue([]),
    getDailySales: jest.fn().mockResolvedValue([]),
  };

  const mockAppointmentsService = {
    findRecent: jest.fn().mockResolvedValue([]),
  };

  const mockTenantRepository = {
    findOne: jest.fn().mockResolvedValue({
      id: 'tenant-1',
      name: 'Test Business',
      businessType: 'restaurant',
      tablesCount: 10,
      capacity: 50,
    }),
  };

  const mockOrderRepository = {
    find: jest.fn().mockResolvedValue([]),
    createQueryBuilder: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getRawOne: jest.fn().mockResolvedValue({ total: 1000 }),
      getMany: jest.fn().mockResolvedValue([]),
      getCount: jest.fn().mockResolvedValue(0),
    }),
    count: jest.fn().mockResolvedValue(0),
  };

  const mockProductRepository = {
    find: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    createQueryBuilder: jest.fn().mockReturnValue({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue([]),
      getCount: jest.fn().mockResolvedValue(0),
    }),
  };

  const mockAppointmentRepository = {
    find: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
  };

  const mockUserRepository = {
    count: jest.fn().mockResolvedValue(0),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: OrdersService, useValue: mockOrdersService },
        { provide: AppointmentsService, useValue: mockAppointmentsService },
        { provide: getRepositoryToken(Tenant), useValue: mockTenantRepository },
        { provide: getRepositoryToken(Order), useValue: mockOrderRepository },
        { provide: getRepositoryToken(Product), useValue: mockProductRepository },
        { provide: getRepositoryToken(Appointment), useValue: mockAppointmentRepository },
        { provide: getRepositoryToken(User), useValue: mockUserRepository },
      ],
    }).compile();

    service = module.get<DashboardService>(DashboardService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getDashboardByBusinessType', () => {
    it('should return dashboard metrics for restaurant', async () => {
      const result = await service.getDashboardByBusinessType('tenant-1');

      expect(result).toHaveProperty('businessType', 'restaurant');
      expect(result).toHaveProperty('tenantName', 'Test Business');
      expect(result).toHaveProperty('general');
      expect(result).toHaveProperty('specific');
      expect(result).toHaveProperty('charts');
    });

    it('should return restaurant-specific metrics', async () => {
      mockTenantRepository.findOne.mockResolvedValue({
        id: 'tenant-1',
        name: 'Test Restaurant',
        businessType: 'restaurant',
        tablesCount: 15,
      });

      const result = await service.getDashboardByBusinessType('tenant-1');

      expect(result.specific).toHaveProperty('tablesCount', 15);
      expect(result.specific).toHaveProperty('peakHour');
    });

    it('should return clinic-specific metrics', async () => {
      mockTenantRepository.findOne.mockResolvedValue({
        id: 'tenant-2',
        name: 'Test Clinic',
        businessType: 'clinic',
      });

      const result = await service.getDashboardByBusinessType('tenant-2');

      expect(result.businessType).toBe('clinic');
      expect(result.specific).toHaveProperty('totalPatients');
      expect(result.specific).toHaveProperty('doctorsCount');
    });

    it('should return retail-specific metrics', async () => {
      mockTenantRepository.findOne.mockResolvedValue({
        id: 'tenant-3',
        name: 'Test Store',
        businessType: 'retail',
      });

      const result = await service.getDashboardByBusinessType('tenant-3');

      expect(result.businessType).toBe('retail');
      expect(result.specific).toHaveProperty('lowStockCount');
      expect(result.specific).toHaveProperty('outOfStockCount');
    });

    it('should return hotel-specific metrics', async () => {
      mockTenantRepository.findOne.mockResolvedValue({
        id: 'tenant-4',
        name: 'Test Hotel',
        businessType: 'hotel',
        capacity: 100,
      });

      const result = await service.getDashboardByBusinessType('tenant-4');

      expect(result.businessType).toBe('hotel');
      expect(result.specific).toHaveProperty('totalRooms', 100);
      expect(result.specific).toHaveProperty('occupancyRate');
    });

    it('should return gym-specific metrics', async () => {
      mockTenantRepository.findOne.mockResolvedValue({
        id: 'tenant-5',
        name: 'Test Gym',
        businessType: 'gym',
      });

      const result = await service.getDashboardByBusinessType('tenant-5');

      expect(result.businessType).toBe('gym');
      expect(result.specific).toHaveProperty('activeMembers');
      expect(result.specific).toHaveProperty('retentionRate');
    });

    it('should return salon-specific metrics', async () => {
      mockTenantRepository.findOne.mockResolvedValue({
        id: 'tenant-6',
        name: 'Test Salon',
        businessType: 'salon',
      });

      const result = await service.getDashboardByBusinessType('tenant-6');

      expect(result.businessType).toBe('salon');
      expect(result.specific).toHaveProperty('popularServices');
      expect(result.specific).toHaveProperty('stylistsCount');
    });
  });

  describe('getRecentActivity', () => {
    it('should return recent activity', async () => {
      mockOrdersService.findRecent.mockResolvedValue([
        { id: 'order-1', createdAt: new Date(), total: 100, status: 'pending', user: { firstName: 'John' } },
      ]);
      mockAppointmentsService.findRecent.mockResolvedValue([]);

      const result = await service.getRecentActivity('tenant-1');

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getSalesChart', () => {
    it('should return sales chart data for 7 days', async () => {
      mockOrdersService.getDailySales.mockResolvedValue([]);

      const result = await service.getSalesChart('tenant-1');

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(7);
    });
  });
});
