import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService password reset', () => {
  const usersService = {
    findByEmail: jest.fn(),
    setPasswordResetToken: jest.fn(),
    findByPasswordResetTokenHash: jest.fn(),
    update: jest.fn(),
  };

  const jwtService = {
    signAsync: jest.fn(),
  };

  const mailService = {
    sendPasswordReset: jest.fn(),
  };

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(usersService as any, jwtService as any, mailService as any);
  });

  it('envia email y guarda token hash cuando el usuario existe', async () => {
    const user = { id: 'user-1', email: 'a@test.com', firstName: 'Ana' };
    usersService.findByEmail.mockResolvedValue(user);

    await service.requestPasswordReset({ email: user.email });

    expect(usersService.setPasswordResetToken).toHaveBeenCalledWith(
      user.id,
      expect.any(String),
      expect.any(Date),
    );
    expect(mailService.sendPasswordReset).toHaveBeenCalledWith({
      email: user.email,
      firstName: user.firstName,
      token: expect.any(String),
    });
  });

  it('retorna ok si el usuario no existe', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    await expect(service.requestPasswordReset({ email: 'missing@test.com' })).resolves.toEqual({
      ok: true,
    });
    expect(mailService.sendPasswordReset).not.toHaveBeenCalled();
  });

  it('rechaza token invalido', async () => {
    usersService.findByPasswordResetTokenHash.mockResolvedValue(null);

    await expect(
      service.confirmPasswordReset({ token: 'bad', newPassword: 'nueva123' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('actualiza password y limpia token', async () => {
    const token = 'valid-token';
    const user = {
      id: 'user-2',
      passwordResetTokenExpiresAt: new Date(Date.now() + 60 * 1000),
    };

    usersService.findByPasswordResetTokenHash.mockResolvedValue(user);

    await service.confirmPasswordReset({ token, newPassword: 'nueva123' });

    expect(usersService.findByPasswordResetTokenHash).toHaveBeenCalledWith(expect.any(String));
    expect(usersService.update).toHaveBeenCalledWith(user.id, {
      passwordHash: expect.any(String),
      passwordResetTokenHash: null,
      passwordResetTokenExpiresAt: null,
    });
  });
});
