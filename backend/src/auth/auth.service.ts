import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  forwardRef,
  Inject,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';
import { MailService } from '../mail/mail.service';
import { InvitationsService } from '../invitations/invitations.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ConfirmPasswordResetDto } from './dto/confirm-password-reset.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly REFRESH_TOKEN_TTL_DAYS = 7;

  constructor(
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    @Inject(forwardRef(() => InvitationsService))
    private readonly invitationsService: InvitationsService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async register(data: RegisterDto) {
    const existing = await this.usersService.findByEmail(data.email);
    if (existing) {
      throw new UnauthorizedException('El correo ya está en uso');
    }

    // Validar invitación si se proporciona invitationId
    let tenantId = data.tenantId;
    let role = data.role;

    if (data.invitationId) {
      const invitation = await this.invitationsService.findById(
        data.invitationId,
      );

      if (!invitation) {
        throw new BadRequestException('Código de invitación inválido');
      }

      if (!invitation.isValid()) {
        if (invitation.status === 'used') {
          throw new BadRequestException(
            'Este código de invitación ya fue utilizado',
          );
        }
        throw new BadRequestException('Este código de invitación ha expirado');
      }

      // Usar datos de la invitación
      tenantId = invitation.tenantId;
      role = invitation.role;
    }

    if (!tenantId) {
      throw new BadRequestException(
        'Se requiere un código de invitación válido para registrarse',
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    // Roles privilegiados no se pueden auto-asignar via registro público
    const SAFE_ROLES = ['user', 'client', 'employee', 'staff'];
    const safeRole = role && SAFE_ROLES.includes(role) ? role : 'user';

    const user = await this.usersService.createUser({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      passwordHash,
      tenantId,
      role: safeRole,
    });

    // Marcar invitación como usada si se proporcionó
    if (data.invitationId) {
      await this.invitationsService.markAsUsed(data.invitationId, user.id);
    }

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

    // Obtener businessType del tenant
    let businessType: string | null = null;
    if (user.tenantId && user.tenantId !== 'system') {
      try {
        const tenant = await this.tenantsService.findOne(user.tenantId);
        businessType = tenant?.businessType || null;
      } catch (error) {
        // Si no se puede obtener el tenant, continuar sin businessType
        this.logger.error('Error fetching tenant for businessType:', error);
      }
    }

    const payload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    // user ya viene sin passwordHash desde validateUser
    return {
      accessToken,
      user: {
        ...user,
        businessType,
      },
    };
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

    await this.usersService.setPasswordResetToken(
      user.id,
      tokenHash,
      expiresAt,
    );

    await this.mailService.sendPasswordReset({
      email: user.email,
      firstName: user.firstName,
      token,
    });

    return { ok: true };
  }

  async confirmPasswordReset(data: ConfirmPasswordResetDto) {
    const tokenHash = this.hashToken(data.token);
    const user =
      await this.usersService.findByPasswordResetTokenHash(tokenHash);

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

  async getUserById(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      return null;
    }

    // Get business type from tenant
    let businessType: string | null = null;
    if (user.tenantId && user.tenantId !== 'system') {
      try {
        const tenant = await this.tenantsService.findOne(user.tenantId);
        businessType = tenant?.businessType || null;
      } catch (error) {
        // Silently fail, businessType is optional
      }
    }

    const {
      passwordHash,
      passwordResetTokenHash,
      passwordResetTokenExpiresAt,
      ...safeUser
    } = user;
    return {
      ...safeUser,
      businessType,
    };
  }

  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Create a new refresh token for a user
   */
  async createRefreshToken(
    userId: string,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<string> {
    // Generate a random token
    const token = crypto.randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(token);

    // Calculate expiration (default 7 days)
    const expiresAt = new Date(
      Date.now() + this.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    );

    // Save hashed token to database
    const refreshToken = this.refreshTokenRepository.create({
      userId,
      token: tokenHash,
      expiresAt,
      deviceInfo,
      ipAddress,
      isRevoked: false,
    });

    await this.refreshTokenRepository.save(refreshToken);

    this.logger.log(`Created refresh token for user: ${userId}`);

    // Return the plain token (to be sent to client)
    return token;
  }

  /**
   * Validate a refresh token
   */
  async validateRefreshToken(token: string): Promise<RefreshToken | null> {
    const tokenHash = this.hashToken(token);

    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token: tokenHash, isRevoked: false },
      relations: ['user'],
    });

    if (!refreshToken) {
      return null;
    }

    // Check if token is expired
    if (refreshToken.expiresAt.getTime() < Date.now()) {
      this.logger.warn(
        `Expired refresh token used for user: ${refreshToken.userId}`,
      );
      return null;
    }

    return refreshToken;
  }

  /**
   * Revoke a refresh token (for logout)
   */
  async revokeRefreshToken(token: string): Promise<boolean> {
    const tokenHash = this.hashToken(token);

    const result = await this.refreshTokenRepository.update(
      { token: tokenHash },
      { isRevoked: true },
    );

    if (result.affected && result.affected > 0) {
      this.logger.log(`Revoked refresh token`);
      return true;
    }

    return false;
  }

  /**
   * Revoke all refresh tokens for a user (for logout all devices)
   */
  async revokeAllUserRefreshTokens(userId: string): Promise<number> {
    const result = await this.refreshTokenRepository.update(
      { userId, isRevoked: false },
      { isRevoked: true },
    );

    this.logger.log(
      `Revoked ${result.affected} refresh tokens for user: ${userId}`,
    );
    return result.affected || 0;
  }

  /**
   * Clean up expired tokens (should be called periodically)
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.refreshTokenRepository
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now: new Date() })
      .execute();

    this.logger.log(`Cleaned up ${result.affected} expired refresh tokens`);
    return result.affected || 0;
  }
}
