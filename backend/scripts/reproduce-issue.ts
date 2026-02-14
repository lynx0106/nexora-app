
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { TenantsService } from '../src/tenants/tenants.service';

async function reproduce() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const tenantsService = app.get(TenantsService);

  const input = {
    tenantId: 'tienda-ropa-luis',
    name: 'Moda Luis SAS',
    sector: 'retail',
    country: 'Colombia',
    city: 'Bogota',
    adminFirstName: 'Luis',
    adminLastName: 'Perez',
    adminEmail: 'luis@moda.com',
    adminPhone: '3001234567',
    adminPassword: 'Password123!',
  };

  console.log('Attempting to create tenant with input:', input);

  try {
    const result = await tenantsService.createTenantWithAdmin(input);
    console.log('Success! Created tenant:', result);
  } catch (error) {
    console.error('Failed to create tenant.');
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Check if it's a "QueryFailedError" from TypeORM
    if (error.driverError) {
        console.error('Driver Error:', error.driverError);
    }
  }

  await app.close();
}

reproduce();
