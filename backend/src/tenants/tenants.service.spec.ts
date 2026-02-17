import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { ForbiddenException, ConflictException } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { Tenant } from './entities/tenant.entity';
import { UsersService } from '../users/users.service';

describe('TenantsService', () => {
  let service: TenantsService;
  let tenantsRepository: Repository<Tenant>;

  const mockTenant: Partial<Tenant> = {
    id: 'tenant-uuid-1',
    name: 'Test Tenant',
    sector: 'restaurante',
    country: 'Colombia',
    city: 'Bogotá',
    address: 'Calle 123',
    phone: '+573001234567',
    email: 'tenant@test.com',
    openingTime: '09:00',
    closingTime: '18:00',
    appointmentDuration: 60,
    language: 'es',
    logoUrl: '',
    coverUrl: '',
    currency: 'COP',
    aiPromptCustomer: '',
    aiPromptSupport: '',
    aiPromptInternal: '',
    mercadoPagoAccessToken: '',
    mercadoPagoPublicKey: '',
    openaiApiKey: '',
    aiModel: 'gpt-3.5-turbo',
    tablesCount: 10,
    capacity: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTenantsRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockUsersService = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    findByEmail: jest.fn(),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      query: jest.fn(),
      createQueryBuilder: jest.fn(),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        {
          provide: getRepositoryToken(Tenant),
          useValue: mockTenantsRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
    tenantsRepository = module.get<Repository<Tenant>>(getRepositoryToken(Tenant));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('debería encontrar tenant por ID', async () => {
      mockTenantsRepository.findOne.mockResolvedValue(mockTenant);

      const result = await service.findOne('tenant-uuid-1');

      expect(result).toEqual(mockTenant);
      expect(mockTenantsRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'tenant-uuid-1' },
      });
    });

    it('debería retornar null si el tenant no existe', async () => {
      mockTenantsRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne('noexistent');

      expect(result).toBeNull();
    });
  });

  describe('getTenantOrThrow', () => {
    it('debería retornar tenant si existe', async () => {
      mockTenantsRepository.findOne.mockResolvedValue(mockTenant);

      const result = await service.getTenantOrThrow('tenant-uuid-1');

      expect(result).toEqual(mockTenant);
    });

    it('debería lanzar error si el tenant no existe', async () => {
      mockTenantsRepository.findOne.mockResolvedValue(null);

      await expect(service.getTenantOrThrow('noexistent')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('generateAvailableTenantId', () => {
    it('debería generar un slug disponible', async () => {
      mockTenantsRepository.findOne.mockResolvedValue(null);

      const result = await service.generateAvailableTenantId('Mi Negocio');

      expect(result).toBe('mi-negocio');
    });

    it('debería agregar contador si el slug ya existe', async () => {
      mockTenantsRepository.findOne
        .mockResolvedValueOnce(mockTenant) // First call: 'mi-negocio' exists
        .mockResolvedValueOnce(null); // Second call: 'mi-negocio-1' doesn't exist

      const result = await service.generateAvailableTenantId('Mi Negocio');

      expect(result).toBe('mi-negocio-1');
    });
  });

  describe('createTenantWithAdmin', () => {
    it('debería crear tenant con admin exitosamente', async () => {
      const createData = {
        name: 'New Tenant',
        sector: 'restaurante',
        adminEmail: 'admin@newtenant.com',
        adminPassword: 'password123',
        adminFirstName: 'Admin',
        adminLastName: 'User',
      };

      mockTenantsRepository.findOne.mockResolvedValue(null);
      
      // Mock tenant creation - first call for tenant, second for admin
      let saveCallCount = 0;
      mockQueryRunner.manager.create.mockImplementation((entity, data) => ({ ...data }));
      mockQueryRunner.manager.save.mockImplementation((entity, data) => {
        saveCallCount++;
        if (saveCallCount === 1) {
          // First save is for tenant
          return Promise.resolve({ ...data, id: 'new-tenant', name: 'New Tenant' });
        }
        // Second save is for admin
        return Promise.resolve({ 
          ...data, 
          id: 'admin-id',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@newtenant.com',
          role: 'admin'
        });
      });
      mockQueryRunner.manager.findOne.mockResolvedValue(null);

      const result = await service.createTenantWithAdmin(createData);

      expect(result.tenant.name).toBe('New Tenant');
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });

    it('debería lanzar error si el tenant ya existe', async () => {
      mockTenantsRepository.findOne.mockResolvedValue(mockTenant);

      await expect(
        service.createTenantWithAdmin({
          tenantId: 'tenant-uuid-1',
          name: 'Test',
          sector: 'restaurante',
          adminEmail: 'admin@test.com',
          adminPassword: 'password',
          adminFirstName: 'Admin',
          adminLastName: 'User',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('debería hacer rollback si hay error', async () => {
      const createData = {
        name: 'New Tenant',
        adminEmail: 'admin@newtenant.com',
        adminPassword: 'password123',
        adminFirstName: 'Admin',
        adminLastName: 'User',
      };

      mockTenantsRepository.findOne.mockResolvedValue(null);
      mockQueryRunner.manager.create.mockImplementation(() => ({}));
      mockQueryRunner.manager.save.mockRejectedValue(new Error('Database error'));

      await expect(service.createTenantWithAdmin(createData)).rejects.toThrow('Database error');
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });

  describe('updateTenantProfile', () => {
    it('debería actualizar perfil del tenant exitosamente', async () => {
      const updatedTenant = { ...mockTenant, name: 'Updated Name' };
      mockTenantsRepository.findOne.mockResolvedValue(mockTenant);
      mockTenantsRepository.save.mockResolvedValue(updatedTenant);

      const result = await service.updateTenantProfile('tenant-uuid-1', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
    });
  });

  describe('getOrCreateTenant', () => {
    it('debería retornar tenant existente', async () => {
      mockTenantsRepository.findOne.mockResolvedValue(mockTenant);

      const result = await service.getOrCreateTenant('tenant-uuid-1');

      expect(result).toEqual(mockTenant);
    });

    it('debería crear tenant si no existe y ALLOW_TENANT_AUTO_CREATE es true', async () => {
      process.env.ALLOW_TENANT_AUTO_CREATE = 'true';
      mockTenantsRepository.findOne.mockResolvedValue(null);
      mockTenantsRepository.create.mockReturnValue(mockTenant);
      mockTenantsRepository.save.mockResolvedValue(mockTenant);

      const result = await service.getOrCreateTenant('new-tenant');

      expect(mockTenantsRepository.create).toHaveBeenCalled();
      expect(mockTenantsRepository.save).toHaveBeenCalled();

      delete process.env.ALLOW_TENANT_AUTO_CREATE;
    });

    it('debería lanzar error si no existe y ALLOW_TENANT_AUTO_CREATE no es true', async () => {
      delete process.env.ALLOW_TENANT_AUTO_CREATE;
      mockTenantsRepository.findOne.mockResolvedValue(null);

      await expect(service.getOrCreateTenant('noexistent')).rejects.toThrow(ForbiddenException);
    });
  });
});
