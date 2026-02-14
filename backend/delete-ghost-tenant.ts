
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { DataSource } from 'typeorm';
import { Tenant } from './src/tenants/entities/tenant.entity';
import { User } from './src/users/entities/user.entity';

async function deleteGhost() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const tenantRepo = dataSource.getRepository(Tenant);
  const userRepo = dataSource.getRepository(User);
  const id = 'tenant-pizzeria-napoli';

  console.log(`Attempting to delete ghost tenant: ${id}`);

  // Check if exists
  const exists = await tenantRepo.findOne({ where: { id } });
  if (!exists) {
      console.log('Tenant not found via findOne.');
      // Try query builder
      const qbExists = await tenantRepo.createQueryBuilder('t').where('t.id = :id', { id }).getOne();
      if(!qbExists) console.log('Tenant not found via QueryBuilder either.');
      else console.log('Found via QueryBuilder:', qbExists);
  } else {
      console.log('Found tenant:', exists);
  }

  // Manual Delete
  const qr = dataSource.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();
  try {
      await qr.query('DELETE FROM "messages" WHERE "tenantId" = $1', [id]);
      await qr.query('DELETE FROM "ai_usage" WHERE "tenantId" = $1', [id]);
      await qr.manager.delete(User, { tenantId: id });
      await qr.manager.delete(Tenant, { id });
      await qr.commitTransaction();
      console.log('Ghost tenant deleted successfully.');
  } catch (err) {
      console.error('Error deleting:', err);
      await qr.rollbackTransaction();
  } finally {
      await qr.release();
      await app.close();
  }
}

deleteGhost();
