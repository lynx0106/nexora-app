
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { TenantsService } from '../src/tenants/tenants.service';
import { DataSource } from 'typeorm';
import { Tenant } from '../src/tenants/entities/tenant.entity';
import { User } from '../src/users/entities/user.entity';

async function checkAndClean() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const tenantRepo = dataSource.getRepository(Tenant);
  const userRepo = dataSource.getRepository(User);

  // 1. Limpiar tenant "tienda-ropa-luis" si quedó a medias
  const tenantId = 'tienda-ropa-luis';
  const tenant = await tenantRepo.findOne({ where: { id: tenantId } });

  if (tenant) {
    console.log(`Found zombie tenant: ${tenant.id} (${tenant.name})`);
    console.log('Deleting zombie tenant...');
    await tenantRepo.remove(tenant);
    console.log('Deleted tenant successfully.');
  } else {
    console.log(`Tenant ${tenantId} not found (clean).`);
  }

  // 2. Limpiar usuario "luis@moda.com" si existe
  const email = 'luis@moda.com';
  const user = await userRepo.findOne({ where: { email } });
  if (user) {
    console.log(`Found conflicting user: ${user.email} (Role: ${user.role}, Tenant: ${user.tenantId})`);
    console.log('Deleting conflicting user...');
    await userRepo.remove(user);
    console.log('Deleted user successfully.');
  } else {
    console.log(`User ${email} not found (clean).`);
  }

  await app.close();
}

checkAndClean();
