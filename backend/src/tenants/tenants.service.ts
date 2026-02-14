import {
  ForbiddenException,
  Injectable,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

interface CreateTenantWithAdminInput {
  tenantId?: string;
  name: string;
  sector?: string;
  country?: string;
  city?: string;
  currency?: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPhone?: string;
  adminPassword: string;
}

interface UpdateTenantProfileInput {
  name?: string;
  sector?: string;
  country?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  openingTime?: string;
  closingTime?: string;
  appointmentDuration?: number;
  language?: string;
  currency?: string;
  logoUrl?: string;
  coverUrl?: string;
  aiPromptCustomer?: string;
  aiPromptSupport?: string;
  aiPromptInternal?: string;
  mercadoPagoPublicKey?: string;
  mercadoPagoAccessToken?: string;
  openaiApiKey?: string;
  aiModel?: string;
  tablesCount?: number;
  capacity?: number;
}

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantsRepository: Repository<Tenant>,
    @Inject(forwardRef(() => UsersService))
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  async generateAvailableTenantId(name: string): Promise<string> {
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[\s]+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    let candidate = baseSlug;
    let counter = 1;

    while (await this.tenantsRepository.findOne({ where: { id: candidate } })) {
      candidate = `${baseSlug}-${counter}`;
      counter++;
    }

    return candidate;
  }

  async createTenantWithAdmin(input: CreateTenantWithAdminInput) {
    const finalTenantId =
      input.tenantId || (await this.generateAvailableTenantId(input.name));

    // Check existing tenant outside transaction to fail fast
    const existingTenant = await this.tenantsRepository.findOne({
      where: { id: finalTenantId },
    });
    if (existingTenant) {
      throw new ForbiddenException('Ya existe un tenant con ese identificador');
    }

    // Start transaction
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Create Tenant
      const tenant = queryRunner.manager.create(Tenant, {
        id: finalTenantId,
        name: input.name,
        sector: input.sector,
        country: input.country,
        city: input.city,
        currency: input.currency || 'USD',
        email: input.adminEmail,
        openingTime: '09:00',
        closingTime: '18:00',
        appointmentDuration: 60,
      });
      const savedTenant = await queryRunner.manager.save(tenant);

      // 2. Check User existence (lock free check first)
      const existingUser = await queryRunner.manager.findOne(User, {
        where: { email: input.adminEmail },
      });
      if (existingUser) {
        throw new ConflictException('El correo ya está en uso');
      }

      // 3. Create Admin User
      const passwordHash = await bcrypt.hash(input.adminPassword, 10);
      const adminUser = queryRunner.manager.create(User, {
        firstName: input.adminFirstName,
        lastName: input.adminLastName,
        email: input.adminEmail,
        phone: input.adminPhone,
        passwordHash,
        role: 'admin',
        tenantId: finalTenantId,
      });
      const savedAdmin = await queryRunner.manager.save(adminUser);

      // Commit transaction
      await queryRunner.commitTransaction();

      const { passwordHash: _, ...safeAdmin } = savedAdmin;
      void _;

      return {
        tenant: savedTenant,
        admin: safeAdmin,
      };
    } catch (error) {
      // Rollback on error
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release connection
      await queryRunner.release();
    }
  }

  async findOne(tenantId: string) {
    return this.tenantsRepository.findOne({
      where: { id: tenantId },
    });
  }

  async getOrCreateTenant(tenantId: string) {
    let tenant = await this.tenantsRepository.findOne({
      where: { id: tenantId },
    });

    if (!tenant) {
      tenant = this.tenantsRepository.create({
        id: tenantId,
        name: tenantId,
      });
      tenant = await this.tenantsRepository.save(tenant);
    }

    return tenant;
  }

  async updateTenantProfile(tenantId: string, input: UpdateTenantProfileInput) {
    console.log(`Updating tenant ${tenantId} with:`, input);
    const tenant = await this.getOrCreateTenant(tenantId);

    if (input.name !== undefined) {
      tenant.name = input.name;
    }
    if (input.sector !== undefined) {
      tenant.sector = input.sector;
    }
    if (input.country !== undefined) {
      tenant.country = input.country;
    }
    if (input.city !== undefined) {
      tenant.city = input.city;
    }
    if (input.address !== undefined) {
      tenant.address = input.address;
    }
    if (input.openingTime !== undefined) {
      tenant.openingTime = input.openingTime;
    }
    if (input.closingTime !== undefined) {
      tenant.closingTime = input.closingTime;
    }
    if (input.appointmentDuration !== undefined) {
      tenant.appointmentDuration = input.appointmentDuration;
    }
    if (input.language !== undefined) {
      tenant.language = input.language;
    }
    if (input.currency !== undefined) {
      tenant.currency = input.currency;
    }
    if (input.logoUrl !== undefined) {
      tenant.logoUrl = input.logoUrl;
    }
    if (input.coverUrl !== undefined) {
      tenant.coverUrl = input.coverUrl;
    }
    if (input.aiPromptCustomer !== undefined) {
      tenant.aiPromptCustomer = input.aiPromptCustomer;
    }
    if (input.aiPromptSupport !== undefined) {
      tenant.aiPromptSupport = input.aiPromptSupport;
    }
    if (input.aiPromptInternal !== undefined) {
      tenant.aiPromptInternal = input.aiPromptInternal;
    }
    if (input.mercadoPagoPublicKey !== undefined) {
      tenant.mercadoPagoPublicKey = input.mercadoPagoPublicKey;
    }
    if (input.mercadoPagoAccessToken !== undefined) {
      tenant.mercadoPagoAccessToken = input.mercadoPagoAccessToken;
    }
    if (input.openaiApiKey !== undefined) {
      tenant.openaiApiKey = input.openaiApiKey;
    }
    if (input.aiModel !== undefined) {
      tenant.aiModel = input.aiModel;
    }
    if (input.tablesCount !== undefined) {
      tenant.tablesCount = input.tablesCount;
    }
    if (input.capacity !== undefined) {
      tenant.capacity = input.capacity;
    }

    return this.tenantsRepository.save(tenant);
  }

  async cleanupTestTenants() {
    console.log('Cleaning up test tenants...');
    // Find test tenants to delete
    const testTenants = await this.tenantsRepository
      .createQueryBuilder('tenant')
      .where('tenant.name LIKE :name OR tenant.id IN (:...ids)', {
        name: 'SimulacionChat-%',
        ids: [
          'tenant-pizzeria-napoli',
          'tenant-moda-urbana',
          'tenant-glamour-salon',
        ],
      })
      .getMany();

    const tenantIds = testTenants.map((t) => t.id);
    if (tenantIds.length === 0) return { count: 0, message: 'No test tenants found' };

    console.log(`Found ${tenantIds.length} tenants to delete:`, tenantIds);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Delete Messages (Raw SQL to avoid circular deps with ChatModule)
      await queryRunner.manager.query(
        'DELETE FROM "messages" WHERE "tenantId" = ANY($1)',
        [tenantIds],
      );

      // 2. Delete AI Usage (Raw SQL)
      await queryRunner.manager.query(
        'DELETE FROM "ai_usage" WHERE "tenantId" = ANY($1)',
        [tenantIds],
      );

      // 3. Delete Users
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(User)
        .where('tenantId IN (:...ids)', { ids: tenantIds })
        .execute();

      // 4. Delete Tenants
      await queryRunner.manager
        .createQueryBuilder()
        .delete()
        .from(Tenant)
        .where('id IN (:...ids)', { ids: tenantIds })
        .execute();

      await queryRunner.commitTransaction();
      return { count: tenantIds.length, ids: tenantIds };
    } catch (err) {
      console.error('Error cleaning up tenants:', err);
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
}
