import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, MoreThan, Repository } from 'typeorm';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import { Invitation } from './entities/invitation.entity';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { TenantsService } from '../tenants/tenants.service';
import { Role } from '../common/constants/roles';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { AcceptInvitationDto } from './dto/accept-invitation.dto';

const DEFAULT_INVITE_TTL_HOURS = 72;

@Injectable()
export class InvitationsService {
  constructor(
    @InjectRepository(Invitation)
    private readonly invitationsRepository: Repository<Invitation>,
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
    private readonly mailService: MailService,
  ) {}

  async createInvitation(
    tenantId: string,
    dto: CreateInvitationDto,
    inviterUserId: string | undefined,
    inviterRole: string | undefined,
  ) {
    if (!Object.values(Role).includes(dto.role as Role)) {
      throw new BadRequestException('Rol invalido');
    }

    if (dto.role === Role.Superadmin && inviterRole !== Role.Superadmin) {
      throw new ForbiddenException('No puedes invitar superadmin');
    }

    const email = dto.email.toLowerCase().trim();
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('El correo ya esta registrado');
    }

    const now = new Date();
    const pendingInvite = await this.invitationsRepository.findOne({
      where: {
        tenantId,
        email,
        acceptedAt: IsNull(),
        expiresAt: MoreThan(now),
      },
    });

    if (pendingInvite) {
      throw new ConflictException('Ya existe una invitacion activa');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    const ttlHours = Number(process.env.INVITE_TTL_HOURS || DEFAULT_INVITE_TTL_HOURS);
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);

    const invitation = this.invitationsRepository.create({
      tenantId,
      email,
      role: dto.role,
      inviterUserId: inviterUserId || null,
      tokenHash,
      expiresAt,
      acceptedAt: null,
    });

    await this.invitationsRepository.save(invitation);

    const tenant = await this.tenantsService.findOne(tenantId);
    const inviter = inviterUserId
      ? await this.usersService.findOne(inviterUserId)
      : null;

    await this.mailService.sendInvitation({
      email,
      token,
      tenantName: tenant?.name || 'Nexora',
      role: dto.role,
      inviterName: inviter
        ? `${inviter.firstName || ''} ${inviter.lastName || ''}`.trim()
        : undefined,
    });

    return { ok: true };
  }

  async acceptInvitation(dto: AcceptInvitationDto) {
    const tokenHash = this.hashToken(dto.token);

    const invitation = await this.invitationsRepository.findOne({
      where: { tokenHash, acceptedAt: IsNull() },
    });

    if (!invitation) {
      throw new BadRequestException('Invitacion invalida');
    }

    if (invitation.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException('Invitacion expirada');
    }

    const existingUser = await this.usersService.findByEmail(invitation.email);
    if (existingUser) {
      throw new ConflictException('El correo ya esta registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.createUser({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: invitation.email,
      passwordHash,
      tenantId: invitation.tenantId,
      role: invitation.role,
      isActive: true,
    });

    await this.invitationsRepository.update(invitation.id, {
      acceptedAt: new Date(),
    });

    return { ok: true, userId: user.id, tenantId: invitation.tenantId };
  }

  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
