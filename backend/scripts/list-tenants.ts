
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { Tenant } from '../src/tenants/entities/tenant.entity';

async function checkTenants() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const tenantRepo = dataSource.getRepository(Tenant);

  const tenants = await tenantRepo.find();
  console.log('All Tenants:', tenants.map(t => ({ id: t.id, name: t.name, email: t.email })));

  await app.close();
}

checkTenants();
