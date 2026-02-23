import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { InvitationCode, InvitationStatus } from './entities/invitation-code.entity';
import { GenerateInvitationDto } from './dto/generate-invitation.dto';
import { TenantsService } from '../tenants/tenants.service';
import { ConfigService } from '@nestjs/config';

export interface InvitationResponse {
  id: string;
  qrData: string;
  deepLink: string;
  webUrl: string;
  expiresAt: Date;
}

export interface ValidatedInvitation {
  valid: boolean;
  invitationId: string;
  tenantId: string;
  tenantName: string;
  role: string;
  expiresAt: Date;
}

@Injectable()
export class InvitationsService {
  private readonly baseUrl: string;
  private readonly invitationExpirationDays = 3;

  constructor(
    @InjectRepository(InvitationCode)
    private invitationsRepository: Repository<InvitationCode>,
    private tenantsService: TenantsService,
    private configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>('BASE_URL') || 'https://nexora-app.online';
  }

  /**
   * Genera una nueva invitación
   */
  async generate(
    dto: GenerateInvitationDto,
    userId: string,
    userTenantId: string,
    userRole: string,
  ): Promise<InvitationResponse> {
    // Determinar el tenant objetivo
    let targetTenantId = userTenantId;
    
    // Superadmin puede especificar tenant
    if (userRole === 'superadmin' && dto.tenantId) {
      targetTenantId = dto.tenantId;
    }

    if (!targetTenantId) {
      throw new ForbiddenException('No tienes permiso para generar invitaciones');
    }

    // Verificar que el tenant existe
    const tenant = await this.tenantsService.findOne(targetTenantId);
    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado');
    }

    // Crear la invitación
    const invitationId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.invitationExpirationDays);

    const invitation = this.invitationsRepository.create({
      id: invitationId,
      tenantId: targetTenantId,
      role: dto.role || 'client',
      createdBy: userId,
      status: 'pending',
      expiresAt,
    });

    await this.invitationsRepository.save(invitation);

    // Generar datos para QR
    const qrData = JSON.stringify({
      type: 'nexora-invite',
      version: 1,
      invitationId,
      tenantId: targetTenantId,
      role: dto.role || 'client',
      tenantName: tenant.name,
      createdAt: Date.now(),
    });

    const deepLink = `nexora://invite?id=${invitationId}&tenant=${targetTenantId}&role=${dto.role || 'client'}&name=${encodeURIComponent(tenant.name)}`;
    const webUrl = `${this.baseUrl}/register?invitationId=${invitationId}&tenant=${targetTenantId}&role=${dto.role || 'client'}`;

    return {
      id: invitationId,
      qrData,
      deepLink,
      webUrl,
      expiresAt,
    };
  }

  /**
   * Valida una invitación
   */
  async validate(invitationId: string): Promise<ValidatedInvitation> {
    const invitation = await this.invitationsRepository.findOne({
      where: { id: invitationId },
      relations: ['tenant'],
    });

    if (!invitation) {
      return {
        valid: false,
        invitationId,
        tenantId: '',
        tenantName: '',
        role: '',
        expiresAt: new Date(),
      };
    }

    // Verificar si está expirada
    if (invitation.isExpired() && invitation.status === 'pending') {
      invitation.status = 'expired';
      await this.invitationsRepository.save(invitation);
    }

    const isValid = invitation.isValid();

    return {
      valid: isValid,
      invitationId: invitation.id,
      tenantId: invitation.tenantId,
      tenantName: invitation.tenant?.name || '',
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    };
  }

  /**
   * Marca una invitación como usada
   */
  async markAsUsed(invitationId: string, userId: string): Promise<void> {
    const invitation = await this.invitationsRepository.findOne({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitación no encontrada');
    }

    if (!invitation.isValid()) {
      throw new BadRequestException(
        invitation.status === 'used'
          ? 'Esta invitación ya fue utilizada'
          : 'Esta invitación ha expirado',
      );
    }

    invitation.status = 'used';
    invitation.usedBy = userId;
    invitation.usedAt = new Date();

    await this.invitationsRepository.save(invitation);
  }

  /**
   * Obtiene la invitación por ID con información del tenant
   */
  async findById(invitationId: string): Promise<InvitationCode | null> {
    return this.invitationsRepository.findOne({
      where: { id: invitationId },
      relations: ['tenant'],
    });
  }

  /**
   * Obtiene todas las invitaciones de un tenant (para admin)
   */
  async findByTenant(tenantId: string): Promise<InvitationCode[]> {
    return this.invitationsRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Marca todas las invitaciones expiradas (job programado)
   */
  async markExpiredInvitations(): Promise<number> {
    const result = await this.invitationsRepository
      .createQueryBuilder()
      .update(InvitationCode)
      .set({ status: 'expired' as InvitationStatus })
      .where('status = :status', { status: 'pending' })
      .andWhere('expiresAt < :now', { now: new Date() })
      .execute();

    return result.affected || 0;
  }
}
