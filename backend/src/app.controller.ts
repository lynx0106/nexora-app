import { Controller, Get, Post, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users/users.service';
import { TenantsService } from './tenants/tenants.service';

@ApiTags('System')
@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly tenantsService: TenantsService,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  health() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'nexora-api',
    };
  }

  /**
   * Endpoint para inicializar datos de prueba
   * Ejecutar una sola vez después del deploy
   */
  @Post('init-test-data')
  @ApiOperation({ summary: 'Initialize test users and tenants (run once after deploy)' })
  async initTestData() {
    this.logger.log('Initializing test data...');
    const results = [];

    // 1. Crear tenant "system" para superadmin
    try {
      const systemTenant = await this.tenantsService.findOne('system');
      if (!systemTenant) {
        await this.tenantsService.create({
          id: 'system',
          name: 'System',
          sector: 'otros',
          country: 'Colombia',
          currency: 'USD',
        } as any);
        results.push('✅ Tenant system created');
      } else {
        results.push('ℹ️ Tenant system already exists');
      }
    } catch (e) {
      results.push(`❌ Error creating system tenant: ${e.message}`);
    }

    // 2. Crear tenant "restaurante-sabor"
    try {
      const restaurantTenant = await this.tenantsService.findOne('restaurante-sabor');
      if (!restaurantTenant) {
        await this.tenantsService.create({
          id: 'restaurante-sabor',
          name: 'Restaurante Sabor Latino',
          sector: 'restaurante',
          country: 'Colombia',
          currency: 'COP',
        } as any);
        results.push('✅ Tenant restaurante-sabor created');
      } else {
        results.push('ℹ️ Tenant restaurante-sabor already exists');
      }
    } catch (e) {
      results.push(`❌ Error creating restaurant tenant: ${e.message}`);
    }

    // 3. Crear Superadmin
    try {
      const superEmail = 'superadmin@saas.com';
      let superUser = await this.usersService.findByEmail(superEmail);
      
      if (!superUser) {
        const hash = await bcrypt.hash('Super123!', 10);
        superUser = await this.usersService.create({
          email: superEmail,
          passwordHash: hash,
          firstName: 'Super',
          lastName: 'Admin',
          role: 'superadmin',
          tenantId: 'system',
          isActive: true,
        } as any);
        results.push('✅ Superadmin created (superadmin@saas.com / Super123!)');
      } else {
        // Reset password
        const hash = await bcrypt.hash('Super123!', 10);
        await this.usersService.update(superUser.id, { passwordHash: hash });
        results.push('✅ Superadmin updated (password: Super123!)');
      }
    } catch (e) {
      results.push(`❌ Error creating superadmin: ${e.message}`);
    }

    // 4. Crear Admin de Restaurante
    try {
      const adminEmail = 'admin@sabor.com';
      let admin = await this.usersService.findByEmail(adminEmail);
      
      if (!admin) {
        const hash = await bcrypt.hash('Password123!', 10);
        admin = await this.usersService.create({
          email: adminEmail,
          passwordHash: hash,
          firstName: 'Carlos',
          lastName: 'Chef',
          role: 'admin',
          tenantId: 'restaurante-sabor',
          isActive: true,
        } as any);
        results.push('✅ Restaurant admin created (admin@sabor.com / Password123!)');
      } else {
        const hash = await bcrypt.hash('Password123!', 10);
        await this.usersService.update(admin.id, { passwordHash: hash });
        results.push('✅ Restaurant admin updated (password: Password123!)');
      }
    } catch (e) {
      results.push(`❌ Error creating restaurant admin: ${e.message}`);
    }

    this.logger.log('Test data initialization completed');
    
    return {
      message: 'Test data initialization completed',
      results,
      credentials: {
        superadmin: { email: 'superadmin@saas.com', password: 'Super123!' },
        restaurantAdmin: { email: 'admin@sabor.com', password: 'Password123!' },
      }
    };
  }

  /**
   * Debug endpoint to check if cookies are being received
   */
  @Get('debug-cookies')
  @ApiOperation({ summary: 'Debug cookies - check if they are being received' })
  debugCookies(@Req() req: Request) {
    return {
      cookies: req.cookies,
      headers: {
        origin: req.headers.origin,
        host: req.headers.host,
        referer: req.headers.referer,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
