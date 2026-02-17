import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: Repository<User>;

  const mockUser: Partial<User> = {
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
    update: jest.fn(),
    count: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      addGroupBy: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getRawMany: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get<Repository<User>>(getRepositoryToken(User));

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

  describe('findOne', () => {
    it('debería encontrar usuario por ID', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('user-uuid-1');

      expect(result).toEqual(mockUser);
      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-uuid-1' },
      });
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
        order: { createdAt: 'ASC' },
      });
    });
  });

  describe('createUser', () => {
    it('debería crear un usuario exitosamente', async () => {
      const createUserData = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        passwordHash: 'hashedpassword',
        tenantId: 'tenant-uuid-1',
        role: 'user',
      };

      mockUsersRepository.create.mockReturnValue({ ...mockUser, ...createUserData });
      mockUsersRepository.save.mockResolvedValue({ ...mockUser, ...createUserData });

      const result = await service.createUser(createUserData);

      expect(result.email).toBe('jane@example.com');
      expect(mockUsersRepository.save).toHaveBeenCalled();
    });
  });

  describe('createUserForTenant', () => {
    it('debería crear usuario para tenant exitosamente', async () => {
      const createData = {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: 'password123',
      };

      mockUsersRepository.findOne.mockResolvedValue(null);
      mockUsersRepository.create.mockReturnValue({ ...mockUser, ...createData });
      mockUsersRepository.save.mockResolvedValue({ ...mockUser, ...createData });

      const result = await service.createUserForTenant('tenant-uuid-1', createData);

      expect(result.email).toBe('jane@example.com');
    });

    it('debería lanzar error si el email ya existe', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);

      await expect(
        service.createUserForTenant('tenant-uuid-1', {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'password',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('debería actualizar usuario exitosamente', async () => {
      const updatedUser = { ...mockUser, firstName: 'Jane' };
      mockUsersRepository.update.mockResolvedValue({ affected: 1 });
      mockUsersRepository.findOne.mockResolvedValue(updatedUser);

      const result = await service.update('user-uuid-1', { firstName: 'Jane' });

      expect(result.firstName).toBe('Jane');
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
      mockUsersRepository.delete.mockResolvedValue({ affected: 1 });

      const result = await service.deleteUser('user-uuid-1', 'tenant-uuid-1');

      expect(result).toBe(true);
    });

    it('debería lanzar error si el usuario no existe', async () => {
      mockUsersRepository.delete.mockResolvedValue({ affected: 0 });

      await expect(
        service.deleteUser('noexistent', 'tenant-uuid-1'),
      ).rejects.toThrow('Usuario no encontrado o no pertenece a este tenant');
    });
  });

  describe('getTenantsSummary', () => {
    it('debería retornar resumen de tenants', async () => {
      const mockSummary = [
        {
          tenantId: 'tenant-1',
          name: 'Tenant 1',
          sector: 'restaurante',
          totalUsers: '5',
          activeUsers: '4',
        },
      ];
      
      // Create a fresh mock for this test
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        leftJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue(mockSummary),
      };
      
      mockUsersRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.getTenantsSummary();

      expect(result[0].tenantId).toBe('tenant-1');
      expect(result[0].totalUsers).toBe(5);
    });
  });

  describe('findByPasswordResetTokenHash', () => {
    it('debería encontrar usuario por token hash', async () => {
      mockUsersRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByPasswordResetTokenHash('token-hash');

      expect(mockUsersRepository.findOne).toHaveBeenCalledWith({
        where: { passwordResetTokenHash: 'token-hash' },
      });
    });
  });

  describe('setPasswordResetToken', () => {
    it('debería establecer token de reseteo', async () => {
      mockUsersRepository.update.mockResolvedValue({ affected: 1 });

      await service.setPasswordResetToken('user-uuid-1', 'token-hash', new Date());

      expect(mockUsersRepository.update).toHaveBeenCalled();
    });
  });

  describe('findAllGlobal', () => {
    it('debería retornar todos los usuarios globalmente', async () => {
      const users = [mockUser];
      mockUsersRepository.find.mockResolvedValue(users);

      const result = await service.findAllGlobal();

      expect(result).toEqual(users);
    });
  });
});
