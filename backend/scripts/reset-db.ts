
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';

async function resetDb() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  
  console.log('Cleaning database...');
  
  // Order matters due to Foreign Key constraints
  const tables = [
    'messages',
    'notifications',
    'ai_usage',
    'order_items',
    'orders',
    'appointments',
    'products',
    'users',
    'tenants'
  ];

  for (const table of tables) {
    console.log(`Deleting from ${table}...`);
    try {
      await dataSource.query(`DELETE FROM "${table}"`);
    } catch (error) {
      console.log(`Warning: Failed to delete from ${table}. It might not exist or has other constraints.`);
      console.log(error.message);
    }
  }

  console.log('Database cleaned successfully.');
  await app.close();
}

resetDb();
