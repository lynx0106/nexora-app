import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';

// Mock bcrypt module
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

// Import bcrypt after mocking
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<any>;
  let jwtService: jest.Mocked<JwtService>;
  let mailService: jest.Mocked<any>;

  const mockUser = {
    id: 'user-123',
    email: 'test@test.com',
    passwordHash: 'hashedPassword',
    firstName: 'Test',
    lastName: 'User',
    role: 'admin',
    tenantId: 'tenant-123',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    // Reset mocks before each test
    jest.clearAllMocks();

    const mockUsersService = {
      findByEmail: jest.fn(),
      createUser: jest.fn(),
      findById: jest.fn(),
      setPasswordResetToken: jest.fn(),
      findByPasswordResetTokenHash: jest.fn(),
      update: jest.fn(),
    };

    const mockJwtService = {
      signAsync: jest.fn(),
      sign: jest.fn(),
      verify: jest.fn(),
    };

    const mockMailService = {
      sendPasswordReset: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    mailService = module.get(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password hash on successful validation', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@test.com', 'password123');

      expect(result).toBeDefined();
      expect(result.email).toBe(mockUser.email);
      expect(result.id).toBe(mockUser.id);
      expect((result as any).passwordHash).toBeUndefined();
      expect(usersService.findByEmail).toHaveBeenCalledWith('test@test.com');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.validateUser('nonexistent@test.com', 'password123'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        service.validateUser('test@test.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('should return access token and user on successful login', async () => {
      const loginDto = { email: 'test@test.com', password: 'password123' };
      const expectedToken = 'jwt-token-123';

      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue(expectedToken);

      const result = await service.login(loginDto);

      expect(result).toEqual({
        accessToken: expectedToken,
        user: expect.objectContaining({
          id: mockUser.id,
          email: mockUser.email,
        }),
      });
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
        tenantId: mockUser.tenantId,
        role: mockUser.role,
      });
    });
  });

  describe('register', () => {
    const registerDto = {
      email: 'newuser@test.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
      tenantId: 'tenant-123',
    };

    it('should create user and return user without password', async () => {
      const hashedPassword = 'hashedPassword123';
      const newUser = {
        ...mockUser,
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      };

      usersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      usersService.createUser.mockResolvedValue(newUser);

      const result = await service.register(registerDto);

      expect(result).toBeDefined();
      expect(result.email).toBe(registerDto.email);
      expect((result as any).passwordHash).toBeUndefined();
      expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(usersService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          email: registerDto.email,
          passwordHash: hashedPassword,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
        }),
      );
    });

    it('should throw UnauthorizedException if email already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      await expect(service.register(registerDto)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(usersService.createUser).not.toHaveBeenCalled();
    });

    it('should assign safe role when registering', async () => {
      const registerWithRole = {
        ...registerDto,
        role: 'admin', // Should be ignored
      };

      usersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hash');
      usersService.createUser.mockResolvedValue(mockUser);

      await service.register(registerWithRole);

      expect(usersService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'user', // Should default to 'user' since 'admin' is not safe
        }),
      );
    });
  });

  describe('requestPasswordReset', () => {
    it('should send password reset email if user exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      usersService.setPasswordResetToken.mockResolvedValue(undefined);
      mailService.sendPasswordReset.mockResolvedValue(undefined);

      const result = await service.requestPasswordReset({ email: 'test@test.com' });

      expect(result).toEqual({ ok: true });
      expect(usersService.setPasswordResetToken).toHaveBeenCalled();
      expect(mailService.sendPasswordReset).toHaveBeenCalledWith(
        expect.objectContaining({
          email: mockUser.email,
          firstName: mockUser.firstName,
        }),
      );
    });

    it('should return ok even if user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.requestPasswordReset({
        email: 'nonexistent@test.com',
      });

      expect(result).toEqual({ ok: true });
      expect(usersService.setPasswordResetToken).not.toHaveBeenCalled();
      expect(mailService.sendPasswordReset).not.toHaveBeenCalled();
    });
  });

  describe('confirmPasswordReset', () => {
    it('should reset password if token is valid', async () => {
      const userWithToken = {
        ...mockUser,
        passwordResetTokenExpiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      };

      usersService.findByPasswordResetTokenHash.mockResolvedValue(userWithToken);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHash');
      usersService.update.mockResolvedValue(undefined);

      const result = await service.confirmPasswordReset({
        token: 'valid-token',
        newPassword: 'newPassword123',
      });

      expect(result).toEqual({ ok: true });
      expect(usersService.update).toHaveBeenCalledWith(
        mockUser.id,
        expect.objectContaining({
          passwordHash: 'newHash',
          passwordResetTokenHash: null,
          passwordResetTokenExpiresAt: null,
        }),
      );
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      usersService.findByPasswordResetTokenHash.mockResolvedValue(null);

      await expect(
        service.confirmPasswordReset({
          token: 'invalid-token',
          newPassword: 'newPassword123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if token is expired', async () => {
      const userWithExpiredToken = {
        ...mockUser,
        passwordResetTokenExpiresAt: new Date(Date.now() - 3600000), // 1 hour ago
      };

      usersService.findByPasswordResetTokenHash.mockResolvedValue(
        userWithExpiredToken,
      );

      await expect(
        service.confirmPasswordReset({
          token: 'expired-token',
          newPassword: 'newPassword123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
