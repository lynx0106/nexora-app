
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { Tenant } from '../src/tenants/entities/tenant.entity';
import * as bcrypt from 'bcrypt';

async function createRestaurantAdmin() {
  console.log('🚀 Creating Restaurant Admin User...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  
  try {
    const userRepo = dataSource.getRepository(User);
    const tenantRepo = dataSource.getRepository(Tenant);
    
    // Ensure tenant exists
    const tenantId = 'verify-restaurant-tenant';
    let tenant = await tenantRepo.findOne({ where: { id: tenantId } });
    
    if (!tenant) {
        console.log('⚠️ Tenant not found, creating it...');
        tenant = tenantRepo.create({
            id: tenantId,
            name: 'Restaurante Verification',
            sector: 'restaurante',
            email: 'restaurant@test.com'
        });
        await tenantRepo.save(tenant);
    }

    const adminEmail = 'admin@restaurant.com';
    const plainPassword = 'password123';
    
    let admin = await userRepo.findOne({ where: { email: adminEmail } });
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    if (!admin) {
        console.log('📝 Creating new admin user...');
        admin = userRepo.create({
            email: adminEmail,
            firstName: 'Carlos',
            lastName: 'Dueño',
            passwordHash,
            tenantId,
            role: 'admin',
            isActive: true
        });
    } else {
        console.log('📝 Updating existing admin user...');
        admin.passwordHash = passwordHash;
        admin.tenantId = tenantId;
        admin.role = 'admin';
        admin.isActive = true;
    }

    await userRepo.save(admin);
    console.log(`✅ Admin user ready: ${adminEmail} / ${plainPassword}`);
    console.log(`✅ Tenant ID: ${tenantId} (Sector: ${tenant.sector})`);

  } catch (error) {
    console.error('❌ Failed:', error);
  } finally {
    await app.close();
  }
}

createRestaurantAdmin();
