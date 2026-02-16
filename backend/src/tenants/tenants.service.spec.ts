import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantsService } from './tenants.service';
import { Tenant } from './entities/tenant.entity';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

describe('TenantsService', () => {
  let service: TenantsService;
  let tenantsRepository: Repository<Tenant>;
  let usersRepository: Repository<User>;

  const mockTenant: Tenant = {
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
    logoUrl: null,
    coverUrl: null,
    currency: 'COP',
    aiPromptCustomer: null,
    aiPromptSupport: null,
    aiPromptInternal: null,
    mercadoPagoAccessToken: null,
    mercadoPagoPublicKey: null,
    openaiApiKey: null,
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
  };

  const mockUsersRepository = {
    create: jest.fn(),
    save: jest.fn(),
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
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
    tenantsRepository = module.get<Repository<Tenant>>(getRepositoryToken(Tenant));
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));

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
        'Tenant no encontrado',
      );
    });
  });

  describe('findAll', () => {
    it('debería retornar todos los tenants', async () => {
      const tenants = [mockTenant];
      mockTenantsRepository.find.mockResolvedValue(tenants);

      const result = await service.findAll();

      expect(result).toEqual(tenants);
      expect(mockTenantsRepository.find).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('debería crear tenant exitosamente', async () => {
      const createData = {
        id: 'new-tenant',
        name: 'New Tenant',
        sector: 'retail',
        currency: 'USD',
      };

      mockTenantsRepository.findOne.mockResolvedValue(null);
      mockTenantsRepository.create.mockReturnValue({ ...mockTenant, ...createData });
      mockTenantsRepository.save.mockResolvedValue({ ...mockTenant, ...createData });

      const result = await service.create(createData);

      expect(result.name).toBe('New Tenant');
      expect(mockTenantsRepository.save).toHaveBeenCalled();
    });

    it('debería lanzar error si el ID ya existe', async () => {
      mockTenantsRepository.findOne.mockResolvedValue(mockTenant);

      await expect(
        service.create({
          id: 'tenant-uuid-1',
          name: 'Test',
          sector: 'restaurante',
        }),
      ).rejects.toThrow('El tenant ya existe');
    });
  });

  describe('createWithAdmin', () => {
    it('debería crear tenant con admin exitosamente', async () => {
      const createData = {
        id: 'new-tenant',
        name: 'New Tenant',
        sector: 'restaurante',
        adminEmail: 'admin@newtenant.com',
        adminPassword: 'password123',
        adminFirstName: 'Admin',
        adminLastName: 'User',
      };

      mockTenantsRepository.findOne.mockResolvedValue(null);
      mockTenantsRepository.create.mockReturnValue({ ...mockTenant, id: createData.id, name: createData.name });
      mockTenantsRepository.save.mockResolvedValue({ ...mockTenant, id: createData.id, name: createData.name });
      mockUsersRepository.create.mockReturnValue({
        id: 'admin-uuid',
        email: createData.adminEmail,
        firstName: createData.adminFirstName,
        lastName: createData.adminLastName,
        role: 'admin',
        tenantId: createData.id,
      });
      mockUsersRepository.save.mockResolvedValue({
        id: 'admin-uuid',
        email: createData.adminEmail,
        role: 'admin',
      });

      const result = await service.createWithAdmin(createData);

      expect(result.tenant.id).toBe('new-tenant');
      expect(result.admin.email).toBe('admin@newtenant.com');
    });
  });

  describe('update', () => {
    it('debería actualizar tenant exitosamente', async () => {
      const updatedTenant = { ...mockTenant, name: 'Updated Name' };
      mockTenantsRepository.findOne.mockResolvedValue(mockTenant);
      mockTenantsRepository.save.mockResolvedValue(updatedTenant);

      const result = await service.update('tenant-uuid-1', { name: 'Updated Name' });

      expect(result.name).toBe('Updated Name');
    });

    it('debería lanzar error si el tenant no existe', async () => {
      mockTenantsRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('noexistent', { name: 'Updated' }),
      ).rejects.toThrow('Tenant no encontrado');
    });
  });

  describe('remove', () => {
    it('debería eliminar tenant exitosamente', async () => {
      mockTenantsRepository.findOne.mockResolvedValue(mockTenant);
      mockTenantsRepository.delete.mockResolvedValue({ affected: 1, raw: [] });

      await expect(service.remove('tenant-uuid-1')).resolves.not.toThrow();
    });

    it('debería lanzar error si el tenant no existe', async () => {
      mockTenantsRepository.findOne.mockResolvedValue(null);

      await expect(service.remove('noexistent')).rejects.toThrow('Tenant no encontrado');
    });
  });
});
