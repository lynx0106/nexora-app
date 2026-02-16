import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: Repository<User>;
  let tenantsRepository: Repository<Tenant>;

  const mockUser: User = {
    id: 'user-uuid-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    passwordHash: 'hashedpassword',
    phone: '+573001234567',
    address: '123 Main St',
    avatarUrl: 'https://example.com/avatar.jpg',
    isActive: true,
    role: 'user',
    tenantId: 'tenant-uuid-1',
    isAiChatActive: true,
    passwordResetTokenHash: null,
    passwordResetTokenExpiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
    })),
  };

  const mockTenantsRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
        {
          provide: getRepositoryToken(Tenant),
          useValue: mockTenantsRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));
    tenantsRepository = module.get<Repository<Tenant>>(getRepositoryToken(Tenant));

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail', () => {
    it('debería encontrar usuario por email', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('john@example.com');

      expect(result).toEqual(mockUser);
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'john@example.com' },
      });
    });

    it('debería retornar null si el usuario no existe', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('noexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findByTenant', () => {
    it('debería retornar usuarios del tenant', async () => {
      const users = [mockUser];
      mockUsersRepository.find.mockResolvedValue(users);

      const result = await service.findByTenant('tenant-uuid-1');

      expect(result).toEqual(users);
      expect(mockUsersRepository.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-uuid-1' },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('createUser', () => {
    it('debería crear un usuario exitosamente', async () => {
      const createUserData = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        tenantId: 'tenant-uuid-1',
        role: 'user',
      };

      mockUsersRepository.findOne.mockResolvedValue(null);
      mockUsersRepository.create.mockReturnValue({ ...mockUser, ...createUserData });
      mockUsersRepository.save.mockResolvedValue({ ...mockUser, ...createUserData });

      const result = await service.createUser(createUserData);

      expect(result.email).toBe('jane@example.com');
      expect(mockUsersRepository.save).toHaveBeenCalled();
    });

    it('debería lanzar error si el email ya existe', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.createUser({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          passwordHash: 'hashed',
          tenantId: 'tenant-uuid-1',
        }),
      ).rejects.toThrow('El correo ya está en uso');
    });
  });

  describe('updateUser', () => {
    it('debería actualizar usuario exitosamente', async () => {
      const updatedUser = { ...mockUser, firstName: 'Jane' };
      mockUsersRepository.findOne.mockResolvedValue(mockUser);
      mockUsersRepository.save.mockResolvedValue(updatedUser);

      const result = await service.updateUser('user-uuid-1', 'tenant-uuid-1', {
        firstName: 'Jane',
      });

      expect(result.firstName).toBe('Jane');
    });

    it('debería lanzar error si el usuario no existe', async () => {
      mockUsersRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateUser('noexistent', 'tenant-uuid-1', { firstName: 'Jane' }),
      ).rejects.toThrow('Usuario no encontrado');
    });
  });

  describe('deleteUser', () => {
    it('debería eliminar usuario exitosamente', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);
      mockUsersRepository.delete.mockResolvedValue({ affected: 1, raw: [] });

      await expect(
        service.deleteUser('user-uuid-1', 'tenant-uuid-1'),
      ).resolves.not.toThrow();
    });

    it('debería lanzar error si se intenta eliminar superadmin', async () => {
      const superadmin = { ...mockUser, role: 'superadmin' };
      mockUsersRepository.findOne.mockResolvedValue(superadmin);

      await expect(
        service.deleteUser('user-uuid-1', 'tenant-uuid-1'),
      ).rejects.toThrow('No se puede eliminar el superadmin');
    });
  });

  describe('getTenantsSummary', () => {
    it('debería retornar resumen de tenants', async () => {
      const mockSummary = [
        {
          tenantId: 'tenant-1',
          name: 'Tenant 1',
          totalUsers: '5',
          activeUsers: '4',
        },
      ];
      mockUsersRepository.createQueryBuilder().getRawMany.mockResolvedValue(mockSummary);

      const result = await service.getTenantsSummary();

      expect(result).toEqual(mockSummary);
    });
  });
});
