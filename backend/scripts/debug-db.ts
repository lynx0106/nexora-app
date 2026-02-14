
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { Tenant } from '../src/tenants/entities/tenant.entity';

async function listAll() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const userRepo = dataSource.getRepository(User);
  const tenantRepo = dataSource.getRepository(Tenant);

  console.log('--- TENANTS ---');
  const tenants = await tenantRepo.find();
  tenants.forEach(t => console.log(`ID: ${t.id}, Name: ${t.name}`));

  console.log('--- USERS (Filtered) ---');
  const users = await userRepo.createQueryBuilder("user")
    .where("user.email LIKE :search", { search: "%luis%" })
    .orWhere("user.email LIKE :search2", { search2: "%moda%" })
    .orWhere("user.email LIKE :search3", { search3: "%prueba%" })
    .getMany();

  if (users.length === 0) {
    console.log('No users found matching luis, moda, or prueba.');
  } else {
    users.forEach(u => console.log(`ID: ${u.id}, Email: '${u.email}', Role: ${u.role}, Tenant: ${u.tenantId}`));
  }

  await app.close();
}

listAll();
