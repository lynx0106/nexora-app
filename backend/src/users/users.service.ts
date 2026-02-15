import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findByEmail(email: string) {
    return this.usersRepository.findOne({ where: { email } });
  }

  findOne(id: string) {
    return this.usersRepository.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<User>) {
    await this.usersRepository.update(id, data);
    return this.findOne(id);
  }

  createUser(data: Partial<User>) {
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  findByTenant(tenantId: string) {
    return this.usersRepository.find({
      where: { tenantId },
      order: { createdAt: 'ASC' },
    });
  }

  findByPasswordResetTokenHash(tokenHash: string) {
    return this.usersRepository.findOne({
      where: { passwordResetTokenHash: tokenHash },
    });
  }

  async setPasswordResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ) {
    await this.usersRepository.update(userId, {
      passwordResetTokenHash: tokenHash,
      passwordResetTokenExpiresAt: expiresAt,
    });
  }

  findAllGlobal() {
    return this.usersRepository.find({
      order: { tenantId: 'ASC', firstName: 'ASC' },
    });
  }

  async createUserForTenant(
    tenantId: string,
    data: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      address?: string;
      password: string;
      role?: string;
    },
  ) {
    const existing = await this.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('El correo ya está en uso');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = this.usersRepository.create({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      address: data.address,
      passwordHash,
      tenantId,
      role: data.role ?? 'user',
    });
    return this.usersRepository.save(user);
  }

  async updateUser(
    userId: string,
    tenantId: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      address?: string;
      avatarUrl?: string;
      role?: string;
      password?: string;
      isActive?: boolean;
    },
  ) {
    const user = await this.usersRepository.findOne({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    if (data.email && data.email !== user.email) {
      const existing = await this.findByEmail(data.email);
      if (existing) {
        throw new Error('El correo ya está en uso');
      }
      user.email = data.email;
    }

    if (data.firstName) user.firstName = data.firstName;
    if (data.lastName) user.lastName = data.lastName;
    if (data.phone) user.phone = data.phone;
    if (data.address) user.address = data.address;
    if (data.avatarUrl) user.avatarUrl = data.avatarUrl;
    if (data.role) user.role = data.role;
    if (data.isActive !== undefined) user.isActive = data.isActive;

    if (data.password) {
      user.passwordHash = await bcrypt.hash(data.password, 10);
    }

    return this.usersRepository.save(user);
  }

  async deleteUser(userId: string, tenantId: string) {
    const result = await this.usersRepository.delete({ id: userId, tenantId });
    if (result.affected === 0) {
      throw new Error('Usuario no encontrado o no pertenece a este tenant');
    }
    return true;
  }

  async getTenantsSummary() {
    const rows = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoin(Tenant, 'tenant', 'tenant.id = user.tenantId')
      .select('user.tenantId', 'tenantId')
      .addSelect('tenant.name', 'name')
      .addSelect('tenant.sector', 'sector')
      .addSelect('COUNT(user.id)', 'totalUsers')
      .addSelect(
        'SUM(CASE WHEN user.isActive = true THEN 1 ELSE 0 END)',
        'activeUsers',
      )
      .where('user.tenantId IS NOT NULL')
      .andWhere("user.tenantId != 'system'")
      .groupBy('user.tenantId')
      .addGroupBy('tenant.name')
      .addGroupBy('tenant.sector')
      .orderBy('user.tenantId', 'ASC')
      .getRawMany();

    return rows.map((row) => ({
      tenantId: row.tenantId,
      name: row.name,
      sector: row.sector,
      totalUsers: Number(row.totalUsers),
      activeUsers: Number(row.activeUsers),
    }));
  }

  findAllUsersAllTenants() {
    return this.usersRepository.find({
      order: { tenantId: 'ASC', createdAt: 'ASC' },
    });
  }

  async seedSuperAdmin() {
    const email = 'superadmin@saas.com';
    const existing = await this.findByEmail(email);
    const passwordHash = await bcrypt.hash('SuperAdmin123!', 10);

    if (existing) {
      // Always update password and ensure critical fields are set
      existing.passwordHash = passwordHash;
      existing.role = 'superadmin';
      existing.tenantId = 'system';
      existing.isActive = true;
      await this.usersRepository.save(existing);
      return { message: 'Superadmin updated (password reset)', user: existing };
    }

    const user = this.usersRepository.create({
      firstName: 'Super',
      lastName: 'Admin',
      email,
      passwordHash,
      role: 'superadmin',
      tenantId: 'system', // System tenant
      isActive: true,
    });

    await this.usersRepository.save(user);
    return { message: 'Superadmin created successfully', user };
  }

  async seedDoctors(tenantId: string) {
    const doctors = [
      {
        firstName: 'Juan',
        lastName: 'Pérez',
        email: `juan.perez@${tenantId}.com`,
        role: 'doctor',
        password: 'DoctorPassword123!',
      },
      {
        firstName: 'Ana',
        lastName: 'Gómez',
        email: `ana.gomez@${tenantId}.com`,
        role: 'doctor',
        password: 'DoctorPassword123!',
      },
    ];

    const createdDoctors: User[] = [];
    for (const doc of doctors) {
      try {
        const existing = await this.findByEmail(doc.email);
        if (existing) {
          createdDoctors.push(existing);
          continue;
        }

        const passwordHash = await bcrypt.hash(doc.password, 10);
        const user = this.usersRepository.create({
          firstName: doc.firstName,
          lastName: doc.lastName,
          email: doc.email,
          passwordHash,
          role: doc.role,
          tenantId,
          isActive: true,
        });
        createdDoctors.push(await this.usersRepository.save(user));
      } catch (e) {
        console.error(`Error creating doctor ${doc.email}`, e);
      }
    }
    return createdDoctors;
  }

  async seedClients(tenantId: string) {
    const clients = [
      {
        firstName: 'Carlos',
        lastName: 'López',
        email: `carlos.lopez@gmail.com`,
      },
      {
        firstName: 'Maria',
        lastName: 'Rodriguez',
        email: `maria.rodriguez@hotmail.com`,
      },
      {
        firstName: 'Luis',
        lastName: 'Martinez',
        email: `luis.martinez@yahoo.com`,
      },
      {
        firstName: 'Sofia',
        lastName: 'Hernandez',
        email: `sofia.hernandez@outlook.com`,
      },
    ];

    const createdClients: User[] = [];
    for (const client of clients) {
      try {
        const existing = await this.findByEmail(client.email);
        if (existing) {
          createdClients.push(existing);
          continue;
        }

        const passwordHash = await bcrypt.hash('ClientPassword123!', 10);
        const user = this.usersRepository.create({
          firstName: client.firstName,
          lastName: client.lastName,
          email: client.email,
          passwordHash,
          role: 'user',
          tenantId,
          isActive: true,
        });
        createdClients.push(await this.usersRepository.save(user));
      } catch (e) {
        console.error(`Error creating client ${client.email}`, e);
      }
    }
    return createdClients;
  }

  async seedDemoUsers() {
    const demoPassword = 'Demo123!';
    const demoUsers = [
      {
        firstName: 'Carlos',
        lastName: 'Lince',
        email: 'carlos.demo@miempresa.com',
        role: 'admin',
        tenantId: 'mi-empresa-saas',
      },
      {
        firstName: 'Luis',
        lastName: 'Lopez',
        email: 'luis.demo@miempresa.com',
        role: 'user',
        tenantId: 'mi-empresa-saas',
      },
      {
        firstName: 'Ana',
        lastName: 'Garcia',
        email: 'ana.demo@clinica.com',
        role: 'admin',
        tenantId: 'clinica-sonrisas',
      },
      {
        firstName: 'Pedro',
        lastName: 'Morales',
        email: 'pedro.demo@clinica.com',
        role: 'user',
        tenantId: 'clinica-sonrisas',
      },
    ];

    const createdOrExisting: User[] = [];

    for (const demo of demoUsers) {
      const existing = await this.findByEmail(demo.email);
      if (existing) {
        createdOrExisting.push(existing);
        continue;
      }

      const passwordHash = await bcrypt.hash(demoPassword, 10);
      const user = this.usersRepository.create({
        firstName: demo.firstName,
        lastName: demo.lastName,
        email: demo.email,
        passwordHash,
        role: demo.role,
        tenantId: demo.tenantId,
        isActive: true,
      });
      const saved = await this.usersRepository.save(user);
      createdOrExisting.push(saved);
    }

    return {
      message: 'Demo users seeded',
      count: createdOrExisting.length,
      demoPassword,
      users: createdOrExisting.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        tenantId: u.tenantId,
      })),
    };
  }
}
