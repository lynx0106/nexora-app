import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ConfirmPasswordResetDto } from './dto/confirm-password-reset.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(data: RegisterDto) {
    const existing = await this.usersService.findByEmail(data.email);
    if (existing) {
      throw new UnauthorizedException('El correo ya está en uso');
    }
    const passwordHash = await bcrypt.hash(data.password, 10);
    // Roles privilegiados no se pueden auto-asignar via registro público
    const SAFE_ROLES = ['user', 'client', 'employee', 'staff'];
    const safeRole = data.role && SAFE_ROLES.includes(data.role) ? data.role : 'user';

    const user = await this.usersService.createUser({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      passwordHash,
      tenantId: data.tenantId,
      role: safeRole,
    });
    const { passwordHash: _, ...safeUser } = user;
    void _;
    return safeUser;
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
    const { passwordHash: _, ...safeUser } = user;
    void _;
    return safeUser;
  }

  async login(data: LoginDto) {
    const user = await this.validateUser(data.email, data.password);
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload);
    return { accessToken, user };
  }

  async requestPasswordReset(data: RequestPasswordResetDto) {
    const user = await this.usersService.findByEmail(data.email);
    if (!user) {
      return { ok: true };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const ttlMinutes = Number(process.env.PASSWORD_RESET_TTL_MINUTES || 30);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    await this.usersService.setPasswordResetToken(user.id, tokenHash, expiresAt);

    await this.mailService.sendPasswordReset({
      email: user.email,
      firstName: user.firstName,
      token,
    });

    return { ok: true };
  }

  async confirmPasswordReset(data: ConfirmPasswordResetDto) {
    const tokenHash = this.hashToken(data.token);
    const user = await this.usersService.findByPasswordResetTokenHash(tokenHash);

    if (!user || !user.passwordResetTokenExpiresAt) {
      throw new UnauthorizedException('Token invalido o expirado');
    }

    if (user.passwordResetTokenExpiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Token invalido o expirado');
    }

    const passwordHash = await bcrypt.hash(data.newPassword, 10);
    await this.usersService.update(user.id, {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetTokenExpiresAt: null,
    });

    return { ok: true };
  }

  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
