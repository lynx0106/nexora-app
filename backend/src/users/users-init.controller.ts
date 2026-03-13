import { Controller, Post, Get, Logger, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import * as bcrypt from 'bcrypt';
import { SetupGuard } from '../common/guards/setup.guard';

@ApiTags('Database Initialization')
@Controller('db-init')
@UseGuards(SetupGuard)
export class UsersInitController {
  private readonly logger = new Logger(UsersInitController.name);

  constructor(private dataSource: DataSource) {}

  @Post('setup')
  @ApiOperation({ summary: 'Initialize database schema and seed data' })
  async setupDatabase() {
    try {
      this.logger.log('Starting database initialization...');

      // Read and execute SQL script
      const sqlPath = path.join(process.cwd(), 'scripts', 'init-database.sql');

      if (!fs.existsSync(sqlPath)) {
        this.logger.warn('SQL script not found at: ' + sqlPath);
        return {
          success: false,
          message:
            'SQL script not found. Please run SQL manually from Supabase dashboard.',
          sqlPath,
        };
      }

      const sqlScript = fs.readFileSync(sqlPath, 'utf8');

      // Execute SQL script
      await this.dataSource.query(sqlScript);
      this.logger.log('SQL schema executed successfully');

      // Create superadmin
      const superadminResult = await this.createSuperadmin();

      // Create demo users
      const demoUsersResult = await this.createDemoUsers();

      return {
        success: true,
        message: 'Database initialized successfully',
        superadmin: superadminResult,
        demoUsers: demoUsersResult,
      };
    } catch (error) {
      this.logger.error('Database initialization failed:', error);
      return {
        success: false,
        message: 'Database initialization failed',
        error: error.message,
      };
    }
  }

  @Get('status')
  @ApiOperation({ summary: 'Check database status' })
  async checkStatus() {
    try {
      // Check if tables exist
      const tables = await this.dataSource.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);

      // Check users count
      const userCount = await this.dataSource.query(
        'SELECT COUNT(*) as count FROM users',
      );

      // Check tenants count
      const tenantCount = await this.dataSource.query(
        'SELECT COUNT(*) as count FROM tenants',
      );

      return {
        connected: true,
        tables: tables.map((t: any) => t.table_name),
        tableCount: tables.length,
        userCount: parseInt(userCount[0].count),
        tenantCount: parseInt(tenantCount[0].count),
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
      };
    }
  }

  @Post('create-superadmin')
  @ApiOperation({ summary: 'Create or reset superadmin user' })
  async createSuperadmin() {
    const email = process.env.SUPERADMIN_EMAIL || 'superadmin@saas.com';
    const password =
      process.env.SUPERADMIN_PASSWORD ||
      (process.env.NODE_ENV === 'production' ? '' : 'NexoraTemp2026!');
    if (!password) {
      throw new Error(
        'SUPERADMIN_PASSWORD must be set in production. Configure in env vars.',
      );
    }
    const passwordHash = await bcrypt.hash(password, 10);

    try {
      // Check if superadmin exists
      const existing = await this.dataSource.query(
        'SELECT id FROM users WHERE email = $1',
        [email],
      );

      if (existing.length > 0) {
        // Update password
        await this.dataSource.query(
          'UPDATE users SET "passwordHash" = $1, "isActive" = true, role = $2 WHERE email = $3',
          [passwordHash, 'superadmin', email],
        );
        this.logger.log('Superadmin password updated');
        return {
          action: 'UPDATED',
          email,
          password,
          message: 'Superadmin password reset successfully',
        };
      } else {
        // Create new superadmin
        await this.dataSource.query(
          `INSERT INTO users (id, email, "passwordHash", "firstName", "lastName", role, "tenantId", "isActive", "createdAt", "updatedAt")
           VALUES (uuid_generate_v4(), $1, $2, 'Super', 'Admin', $3, 'system', true, NOW(), NOW())`,
          [email, passwordHash, 'superadmin'],
        );
        this.logger.log('Superadmin created');
        return {
          action: 'CREATED',
          email,
          password,
          message: 'Superadmin created successfully',
        };
      }
    } catch (error) {
      this.logger.error('Failed to create superadmin:', error);
      throw error;
    }
  }

  @Post('create-demo-users')
  @ApiOperation({ summary: 'Create demo users' })
  async createDemoUsers() {
    const demoPassword =
      process.env.DEMO_USERS_PASSWORD ||
      (process.env.NODE_ENV === 'production' ? '' : 'Demo2026!');
    if (!demoPassword && process.env.NODE_ENV === 'production') {
      throw new Error(
        'DEMO_USERS_PASSWORD must be set in production for demo users.',
      );
    }
    const pwd = demoPassword || 'Demo2026!';
    const passwordHash = await bcrypt.hash(pwd, 10);

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

    const results: Array<{ email: string; action: string; error?: string }> =
      [];

    for (const user of demoUsers) {
      try {
        const existing = await this.dataSource.query(
          'SELECT id FROM users WHERE email = $1',
          [user.email],
        );

        if (existing.length > 0) {
          results.push({ email: user.email, action: 'EXISTS' });
        } else {
          await this.dataSource.query(
            `INSERT INTO users (id, email, "passwordHash", "firstName", "lastName", role, "tenantId", "isActive", "createdAt", "updatedAt")
             VALUES (uuid_generate_v4(), $1, $2, $3, $4, $5, $6, true, NOW(), NOW())`,
            [
              user.email,
              passwordHash,
              user.firstName,
              user.lastName,
              user.role,
              user.tenantId,
            ],
          );
          results.push({ email: user.email, action: 'CREATED' });
        }
      } catch (error) {
        this.logger.error(`Failed to create user ${user.email}:`, error);
        results.push({
          email: user.email,
          action: 'ERROR',
          error: (error as Error).message,
        });
      }
    }

    return {
      password: pwd,
      users: results,
    };
  }
}
