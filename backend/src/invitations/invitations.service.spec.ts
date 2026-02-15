import { ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { InvitationsService } from './invitations.service';
import { Invitation } from './entities/invitation.entity';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { TenantsService } from '../tenants/tenants.service';
import { Role } from '../common/constants/roles';

describe('InvitationsService', () => {
  const invitationRepo = {
    findOne: jest.fn(),
    create: jest.fn((data) => data),
    save: jest.fn(),
    update: jest.fn(),
  };
  const usersService = {
    findByEmail: jest.fn(),
    createUser: jest.fn(),
    findOne: jest.fn(),
  };
  const mailService = { sendInvitation: jest.fn() };
  const tenantsService = { findOne: jest.fn() };

  let service: InvitationsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationsService,
        {
          provide: getRepositoryToken(Invitation),
          useValue: invitationRepo,
        },
        { provide: UsersService, useValue: usersService },
        { provide: TenantsService, useValue: tenantsService },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    service = module.get<InvitationsService>(InvitationsService);
  });

  it('evita crear invitacion si existe usuario', async () => {
    usersService.findByEmail.mockResolvedValue({ id: 'user-1' });

    await expect(
      service.createInvitation('tenant-1', { email: 'a@test.com', role: Role.User }, 'inv-1', Role.Admin),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('acepta invitacion y crea usuario', async () => {
    invitationRepo.findOne.mockResolvedValue({
      id: 'inv-1',
      email: 'a@test.com',
      role: Role.User,
      tenantId: 'tenant-1',
      expiresAt: new Date(Date.now() + 1000),
      acceptedAt: null,
    });
    usersService.findByEmail.mockResolvedValue(null);
    usersService.createUser.mockResolvedValue({ id: 'user-1' });

    const result = await service.acceptInvitation({
      token: 'token',
      firstName: 'Ana',
      lastName: 'Perez',
      password: 'Password123',
    });

    expect(result.ok).toBe(true);
    expect(usersService.createUser).toHaveBeenCalled();
    expect(invitationRepo.update).toHaveBeenCalled();
  });
});
