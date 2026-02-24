import { Injectable, UnauthorizedException, BadRequestException, forwardRef, Inject, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';
import { MailService } from '../mail/mail.service';
import { InvitationsService } from '../invitations/invitations.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RequestPasswordResetDto } from './dto/request-password-reset.dto';
import { ConfirmPasswordResetDto } from './dto/confirm-password-reset.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    @Inject(forwardRef(() => InvitationsService))
    private readonly invitationsService: InvitationsService,
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
      const invitation = await this.invitationsService.findById(data.invitationId);
      
      if (!invitation) {
        throw new BadRequestException('Código de invitación inválido');
      }

      if (!invitation.isValid()) {
        if (invitation.status === 'used') {
          throw new BadRequestException('Este código de invitación ya fue utilizado');
        }
        throw new BadRequestException('Este código de invitación ha expirado');
      }

      // Usar datos de la invitación
      tenantId = invitation.tenantId;
      role = invitation.role;
    }

    if (!tenantId) {
      throw new BadRequestException('Se requiere un código de invitación válido para registrarse');
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
      }
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
    
    const { passwordHash, passwordResetTokenHash, passwordResetTokenExpiresAt, ...safeUser } = user;
    return {
      ...safeUser,
      businessType,
    };
  }

  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
