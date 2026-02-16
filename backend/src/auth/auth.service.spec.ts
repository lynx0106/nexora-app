import { UnauthorizedException, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  // Mocks para los servicios dependientes
  const mockUsersService = {
    findByEmail: jest.fn(),
    createUser: jest.fn(),
    setPasswordResetToken: jest.fn(),
    findByPasswordResetTokenHash: jest.fn(),
    update: jest.fn(),
  };

  const mockJwtService = {
    signAsync: jest.fn(),
  };

  const mockMailService = {
    sendPasswordReset: jest.fn(),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      mockUsersService as any,
      mockJwtService as any,
      mockMailService as any,
    );
  });

  // === TESTS DE REGISTER ===

  describe('register', () => {
    it('debería crear un usuario exitosamente', async () => {
      const registerDto = {
        firstName: 'Juan',
        lastName: 'Perez',
        email: 'juan@test.com',
        password: 'password123',
        tenantId: 'tenant-1',
      };

      const mockUser = {
        id: 'user-1',
        ...registerDto,
        passwordHash: 'hashed_password',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.createUser.mockResolvedValue(mockUser);

      const result = await service.register(registerDto);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith('juan@test.com');
      expect(mockUsersService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: 'Juan',
          lastName: 'Perez',
          email: 'juan@test.com',
          tenantId: 'tenant-1',
        }),
      );
      // Verificar que el passwordHash fue removido del resultado
      expect(result).not.toHaveProperty('passwordHash');
    });

    it('debería lanzar conflicto si el email ya existe', async () => {
      const registerDto = {
        firstName: 'Juan',
        lastName: 'Perez',
        email: 'existente@test.com',
        password: 'password123',
        tenantId: 'tenant-1',
      };

      mockUsersService.findByEmail.mockResolvedValue({ id: 'existing-user' });

      await expect(service.register(registerDto)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('debería asignar rol seguro (user) aunque se intente asignar superadmin', async () => {
      const registerDto = {
        firstName: 'Juan',
        lastName: 'Perez',
        email: 'juan2@test.com',
        password: 'password123',
        tenantId: 'tenant-1',
        role: 'superadmin', // Intento de rol privilegiado
      };

      const mockUser = {
        id: 'user-2',
        firstName: 'Juan',
        lastName: 'Perez',
        email: 'juan2@test.com',
        passwordHash: 'hashed',
        role: 'user', // Debe ser 'user', no 'superadmin'
      };

      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.createUser.mockResolvedValue(mockUser);

      await service.register(registerDto);

      expect(mockUsersService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'user' }),
      );
    });

    it('debería permitir roles seguros (client, employee)', async () => {
      const registerDto = {
        firstName: 'Maria',
        lastName: 'Garcia',
        email: 'maria@test.com',
        password: 'password123',
        tenantId: 'tenant-1',
        role: 'client',
      };

      const mockUser = {
        id: 'user-3',
        firstName: 'Maria',
        role: 'client',
      };

      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.createUser.mockResolvedValue(mockUser);

      await service.register(registerDto);

      expect(mockUsersService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'client' }),
      );
    });
  });

  // === TESTS DE LOGIN ===

  describe('login', () => {
    it('debería retornar token y usuario válido', async () => {
      const loginDto = {
        email: 'juan@test.com',
        password: 'password123',
      };

      const mockUser = {
        id: 'user-1',
        email: 'juan@test.com',
        firstName: 'Juan',
        lastName: 'Perez',
        passwordHash: 'hashed_password',
        tenantId: 'tenant-1',
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockResolvedValue('jwt-token-123');

      // Mock de bcrypt.compare
      jest.spyOn(require('bcrypt'), 'compare').mockImplementation(() => Promise.resolve(true));

      const result = await service.login(loginDto);

      expect(result.accessToken).toBe('jwt-token-123');
      expect(result.user.email).toBe('juan@test.com');
      // Verificar que passwordHash no está en el resultado
      expect(result.user).not.toHaveProperty('passwordHash');
    });

    it('debería fallar con email inexistente', async () => {
      const loginDto = {
        email: 'noexiste@test.com',
        password: 'password123',
      };

      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('debería fallar con password incorrecto', async () => {
      const loginDto = {
        email: 'juan@test.com',
        password: 'password incorrecto',
      };

      const mockUser = {
        id: 'user-1',
        email: 'juan@test.com',
        passwordHash: 'hashed_password',
      };

      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      jest.spyOn(require('bcrypt'), 'compare').mockImplementation(() => Promise.resolve(false));

      await expect(service.login(loginDto)).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });

  // === TESTS DE PASSWORD RESET ===

  describe('requestPasswordReset', () => {
    it('debería enviar email y guardar token cuando el usuario existe', async () => {
      const user = { id: 'user-1', email: 'a@test.com', firstName: 'Ana' };
      mockUsersService.findByEmail.mockResolvedValue(user);

      await service.requestPasswordReset({ email: user.email });

      expect(mockUsersService.setPasswordResetToken).toHaveBeenCalledWith(
        user.id,
        expect.any(String),
        expect.any(Date),
      );
      expect(mockMailService.sendPasswordReset).toHaveBeenCalledWith({
        email: user.email,
        firstName: user.firstName,
        token: expect.any(String),
      });
    });

    it('debería retornar ok si el usuario no existe (seguridad)', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.requestPasswordReset({ email: 'missing@test.com' })).resolves.toEqual({
        ok: true,
      });
      expect(mockMailService.sendPasswordReset).not.toHaveBeenCalled();
    });
  });

  describe('confirmPasswordReset', () => {
    it('debería rechazar token inválido', async () => {
      mockUsersService.findByPasswordResetTokenHash.mockResolvedValue(null);

      await expect(
        service.confirmPasswordReset({ token: 'bad', newPassword: 'nueva123' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('debería actualizar password y limpiar token', async () => {
      const token = 'valid-token';
      const user = {
        id: 'user-2',
        passwordResetTokenExpiresAt: new Date(Date.now() + 60 * 1000),
      };

      mockUsersService.findByPasswordResetTokenHash.mockResolvedValue(user);

      await service.confirmPasswordReset({ token, newPassword: 'nueva123' });

      expect(mockUsersService.findByPasswordResetTokenHash).toHaveBeenCalledWith(expect.any(String));
      expect(mockUsersService.update).toHaveBeenCalledWith(user.id, {
        passwordHash: expect.any(String),
        passwordResetTokenHash: null,
        passwordResetTokenExpiresAt: null,
      });
    });
  });
});
