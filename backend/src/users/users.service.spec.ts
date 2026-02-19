import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword123'),
  compare: jest.fn().mockResolvedValue(true),
}));

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: jest.Mocked<Repository<User>>;

  const mockUser = {
    id: 'user-123',
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phone: '+1234567890',
    passwordHash: 'hashedPassword123',
    tenantId: 'tenant-123',
    role: 'user',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockUserRepo = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createQueryBuilder: jest.fn(() => ({
        leftJoin: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        groupBy: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          {
            tenantId: 'tenant-123',
            name: 'Test Tenant',
            sector: 'restaurant',
            totalUsers: '10',
            activeUsers: '8',
          },
        ]),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: mockUserRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepo = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      userRepo.findOne.mockResolvedValue(mockUser as any);

      const result = await service.findByEmail('test@example.com');

      expect(result).toEqual(mockUser);
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });

    it('should return null if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      userRepo.findOne.mockResolvedValue(mockUser as any);

      const result = await service.findOne('user-123');

      expect(result).toEqual(mockUser);
      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { id: 'user-123' } });
    });
  });

  describe('createUser', () => {
    it('should create a user successfully', async () => {
      const userData = {
        firstName: 'New',
        lastName: 'User',
        email: 'new@example.com',
        passwordHash: 'hashedPassword',
        tenantId: 'tenant-123',
      };

      userRepo.create.mockReturnValue(mockUser as any);
      userRepo.save.mockResolvedValue(mockUser as any);

      const result = await service.createUser(userData);

      expect(result).toBeDefined();
      expect(userRepo.create).toHaveBeenCalledWith(userData);
      expect(userRepo.save).toHaveBeenCalled();
    });
  });

  describe('findByTenant', () => {
    it('should return all users for a tenant', async () => {
      userRepo.find.mockResolvedValue([mockUser] as any);

      const result = await service.findByTenant('tenant-123');

      expect(result).toEqual([mockUser]);
      expect(userRepo.find).toHaveBeenCalledWith({
        where: { tenantId: 'tenant-123' },
        order: { createdAt: 'ASC' },
      });
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updatedUser = { ...mockUser, firstName: 'Updated' };
      userRepo.update.mockResolvedValue({ affected: 1 } as any);
      userRepo.findOne.mockResolvedValue(updatedUser as any);

      const result = await service.update('user-123', { firstName: 'Updated' });

      expect(result?.firstName).toBe('Updated');
      expect(userRepo.update).toHaveBeenCalledWith('user-123', {
        firstName: 'Updated',
      });
    });
  });

  describe('createUserForTenant', () => {
    it('should create a user for a tenant with hashed password', async () => {
      const createData = {
        firstName: 'New',
        lastName: 'User',
        email: 'new@example.com',
        password: 'plainPassword123',
        role: 'user',
      };

      userRepo.findOne.mockResolvedValue(null); // No existing user
      userRepo.create.mockReturnValue(mockUser as any);
      userRepo.save.mockResolvedValue(mockUser as any);

      const result = await service.createUserForTenant('tenant-123', createData);

      expect(result).toBeDefined();
      expect(bcrypt.hash).toHaveBeenCalledWith('plainPassword123', 10);
      expect(userRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          passwordHash: 'hashedPassword123',
          tenantId: 'tenant-123',
        }),
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      const createData = {
        firstName: 'New',
        lastName: 'User',
        email: 'existing@example.com',
        password: 'plainPassword123',
      };

      userRepo.findOne.mockResolvedValue(mockUser as any); // Existing user

      await expect(
        service.createUserForTenant('tenant-123', createData),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateUser', () => {
    it('should update user fields', async () => {
      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
      };

      userRepo.findOne.mockResolvedValue(mockUser as any);
      userRepo.save.mockResolvedValue({ ...mockUser, ...updateData } as any);

      const result = await service.updateUser('user-123', 'tenant-123', updateData);

      expect(result?.firstName).toBe('Updated');
      expect(userRepo.save).toHaveBeenCalled();
    });

    it('should hash password when updating password', async () => {
      const updateData = { password: 'newPassword123' };

      userRepo.findOne.mockResolvedValue(mockUser as any);
      userRepo.save.mockResolvedValue(mockUser as any);

      await service.updateUser('user-123', 'tenant-123', updateData);

      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword123', 10);
    });

    it('should throw error if user not found', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(
        service.updateUser('nonexistent', 'tenant-123', { firstName: 'Test' }),
      ).rejects.toThrow('Usuario no encontrado');
    });

    it('should throw error if email is already in use by another user', async () => {
      const updateData = { email: 'another@example.com' };
      const existingUser = { ...mockUser, id: 'different-id' };

      userRepo.findOne
        .mockResolvedValueOnce(mockUser as any) // First call for finding user
        .mockResolvedValueOnce(existingUser as any); // Second call for email check

      await expect(
        service.updateUser('user-123', 'tenant-123', updateData),
      ).rejects.toThrow('El correo ya está en uso');
    });
  });

  describe('deleteUser', () => {
    it('should delete a user', async () => {
      userRepo.delete.mockResolvedValue({ affected: 1 } as any);

      const result = await service.deleteUser('user-123', 'tenant-123');

      expect(result).toBe(true);
      expect(userRepo.delete).toHaveBeenCalledWith({
        id: 'user-123',
        tenantId: 'tenant-123',
      });
    });

    it('should throw error if user not found', async () => {
      userRepo.delete.mockResolvedValue({ affected: 0 } as any);

      await expect(
        service.deleteUser('nonexistent', 'tenant-123'),
      ).rejects.toThrow('Usuario no encontrado o no pertenece a este tenant');
    });
  });

  describe('getTenantsSummary', () => {
    it('should return tenants summary with user counts', async () => {
      const result = await service.getTenantsSummary();

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('tenantId');
      expect(result[0]).toHaveProperty('totalUsers');
      expect(result[0]).toHaveProperty('activeUsers');
    });
  });

  describe('setPasswordResetToken', () => {
    it('should set password reset token for user', async () => {
      userRepo.update.mockResolvedValue({ affected: 1 } as any);

      const expiresAt = new Date(Date.now() + 3600000); // 1 hour
      await service.setPasswordResetToken('user-123', 'tokenHash', expiresAt);

      expect(userRepo.update).toHaveBeenCalledWith('user-123', {
        passwordResetTokenHash: 'tokenHash',
        passwordResetTokenExpiresAt: expiresAt,
      });
    });
  });

  describe('findByPasswordResetTokenHash', () => {
    it('should find user by reset token hash', async () => {
      userRepo.findOne.mockResolvedValue(mockUser as any);

      const result = await service.findByPasswordResetTokenHash('tokenHash');

      expect(result).toEqual(mockUser);
      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { passwordResetTokenHash: 'tokenHash' },
      });
    });
  });

  describe('seedSuperAdmin', () => {
    it('should create superadmin if not exists', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue(mockUser as any);
      userRepo.save.mockResolvedValue(mockUser as any);

      const result = await service.seedSuperAdmin();

      expect(result.message).toBe('Superadmin created successfully');
      expect(bcrypt.hash).toHaveBeenCalled();
    });

    it('should update superadmin if exists', async () => {
      const existingAdmin = {
        ...mockUser,
        email: 'superadmin@saas.com',
        role: 'superadmin',
      };
      userRepo.findOne.mockResolvedValue(existingAdmin as any);
      userRepo.save.mockResolvedValue(existingAdmin as any);

      const result = await service.seedSuperAdmin();

      expect(result.message).toBe('Superadmin updated (password reset)');
    });
  });

  describe('findForReport', () => {
    it('should return users for report within date range', async () => {
      userRepo.find.mockResolvedValue([mockUser] as any);

      const start = new Date('2024-01-01');
      const end = new Date('2024-12-31');
      const result = await service.findForReport('tenant-123', start, end);

      expect(result).toEqual([mockUser]);
      expect(userRepo.find).toHaveBeenCalledWith({
        where: {
          tenantId: 'tenant-123',
          createdAt: expect.anything(),
        },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findAllGlobal', () => {
    it('should return all users globally', async () => {
      userRepo.find.mockResolvedValue([mockUser] as any);

      const result = await service.findAllGlobal();

      expect(result).toEqual([mockUser]);
      expect(userRepo.find).toHaveBeenCalledWith({
        order: { tenantId: 'ASC', firstName: 'ASC' },
      });
    });
  });

  describe('findAllUsersAllTenants', () => {
    it('should return all users from all tenants', async () => {
      userRepo.find.mockResolvedValue([mockUser] as any);

      const result = await service.findAllUsersAllTenants();

      expect(result).toEqual([mockUser]);
      expect(userRepo.find).toHaveBeenCalledWith({
        order: { tenantId: 'ASC', createdAt: 'ASC' },
      });
    });
  });

  describe('seedDoctors', () => {
    it('should seed doctors for a tenant', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue(mockUser as any);
      userRepo.save.mockResolvedValue(mockUser as any);

      const result = await service.seedDoctors('clinica-test');

      expect(result).toBeDefined();
      expect(result.length).toBe(2);
    });

    it('should return existing doctors if already exist', async () => {
      userRepo.findOne.mockResolvedValue(mockUser as any);

      const result = await service.seedDoctors('clinica-test');

      expect(result).toBeDefined();
    });
  });

  describe('seedClients', () => {
    it('should seed clients for a tenant', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue(mockUser as any);
      userRepo.save.mockResolvedValue(mockUser as any);

      const result = await service.seedClients('tenant-123');

      expect(result).toBeDefined();
      expect(result.length).toBe(4);
    });

    it('should return existing clients if already exist', async () => {
      userRepo.findOne.mockResolvedValue(mockUser as any);

      const result = await service.seedClients('tenant-123');

      expect(result).toBeDefined();
    });
  });

  describe('seedDemoUsers', () => {
    it('should seed demo users', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockReturnValue(mockUser as any);
      userRepo.save.mockResolvedValue(mockUser as any);

      const result = await service.seedDemoUsers();

      expect(result.message).toBe('Demo users seeded');
      expect(result.count).toBe(4);
      expect(result.demoPassword).toBe('Demo123!');
    });

    it('should return existing demo users if already exist', async () => {
      userRepo.findOne.mockResolvedValue(mockUser as any);

      const result = await service.seedDemoUsers();

      expect(result.count).toBe(4);
    });
  });
});
