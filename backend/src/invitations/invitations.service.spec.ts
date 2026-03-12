import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { InvitationsService } from './invitations.service';
import { InvitationCode } from './entities/invitation-code.entity';
import { TenantsService } from '../tenants/tenants.service';
import { ConfigService } from '@nestjs/config';

describe('InvitationsService', () => {
  const invitationRepo = {
    findOne: jest.fn(),
    create: jest.fn((data) => data),
    save: jest.fn(),
    update: jest.fn(),
    find: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      update: jest.fn(() => ({
        set: jest.fn(() => ({
          where: jest.fn(() => ({
            andWhere: jest.fn(() => ({
              execute: jest.fn(() => ({ affected: 0 })),
            })),
          })),
        })),
      })),
    })),
  };
  const tenantsService = {
    findOne: jest.fn(),
  };
  const configService = {
    get: jest.fn(() => 'https://nexora-app.online'),
  };

  let service: InvitationsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationsService,
        {
          provide: getRepositoryToken(InvitationCode),
          useValue: invitationRepo,
        },
        { provide: TenantsService, useValue: tenantsService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<InvitationsService>(InvitationsService);
  });

  it('genera una invitación correctamente', async () => {
    tenantsService.findOne.mockResolvedValue({
      id: 'tenant-1',
      name: 'Restaurante Demo',
    });
    invitationRepo.create.mockReturnValue({
      id: 'inv-1',
      tenantId: 'tenant-1',
      role: 'client',
      status: 'pending',
    });
    invitationRepo.save.mockResolvedValue({});

    const result = await service.generate(
      { role: 'client' },
      'admin-1',
      'tenant-1',
      'admin',
    );

    expect(result.id).toBeDefined();
    expect(result.qrData).toContain('nexora-invite');
    expect(result.deepLink).toContain('nexora://invite');
  });

  it('valida una invitación existente', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    invitationRepo.findOne.mockResolvedValue({
      id: 'inv-1',
      tenantId: 'tenant-1',
      role: 'client',
      status: 'pending',
      expiresAt: futureDate,
      isValid: () => true,
      isExpired: () => false,
      tenant: { name: 'Restaurante Demo' },
    });

    const result = await service.validate('inv-1');

    expect(result.valid).toBe(true);
    expect(result.tenantId).toBe('tenant-1');
  });

  it('rechaza invitación expirada', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    invitationRepo.findOne.mockResolvedValue({
      id: 'inv-1',
      tenantId: 'tenant-1',
      role: 'client',
      status: 'pending',
      expiresAt: pastDate,
      isValid: () => false,
      isExpired: () => true,
      tenant: { name: 'Restaurante Demo' },
    });

    const result = await service.validate('inv-1');

    expect(result.valid).toBe(false);
  });

  it('marca invitación como usada', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    invitationRepo.findOne.mockResolvedValue({
      id: 'inv-1',
      tenantId: 'tenant-1',
      role: 'client',
      status: 'pending',
      expiresAt: futureDate,
      isValid: () => true,
    });
    invitationRepo.save.mockResolvedValue({});

    await service.markAsUsed('inv-1', 'user-1');

    expect(invitationRepo.save).toHaveBeenCalled();
  });

  it('rechaza usar invitación ya usada', async () => {
    invitationRepo.findOne.mockResolvedValue({
      id: 'inv-1',
      tenantId: 'tenant-1',
      role: 'client',
      status: 'used',
      isValid: () => false,
    });

    await expect(service.markAsUsed('inv-1', 'user-1')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
