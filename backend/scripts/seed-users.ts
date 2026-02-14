import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';
import { TenantsService } from '../src/tenants/tenants.service';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const tenantsService = app.get(TenantsService);

  console.log('Creating additional test users...');

  // 1. Ensure 'system' tenant exists for Superadmin
  try {
    const systemTenant = await tenantsService.findOne('system');
    if (!systemTenant) {
      console.log('Creating system tenant...');
      await tenantsService.createTenantWithAdmin({
        tenantId: 'system',
        name: 'System',
        adminEmail: 'temp@system.com',
        adminFirstName: 'System',
        adminLastName: 'Admin',
        adminPassword: 'temp',
        adminPhone: '',
      });
      // Update it to be strictly system if needed, but standard create is fine
    }
  } catch (e) {
    console.log('System tenant might already exist or error:', e.message);
  }

  // 2. Create Superadmin
  const superEmail = 'superadmin@saas.com';
  const superPass = 'Super123!';

  const superUser = await usersService.findByEmail(superEmail);
  if (!superUser) {
    console.log(`Creating Superadmin: ${superEmail}`);
    const hash = await bcrypt.hash(superPass, 10);
    // We use direct repository access or a service method that allows setting role
    // UsersService.create might default to 'user' or 'admin' depending on implementation
    // Let's use createUserForTenant which sets role
    // But we need 'superadmin' role.
    // Let's create as admin then update role.
    const user = await usersService.createUserForTenant('system', {
      email: superEmail,
      password: superPass,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'superadmin', // Try passing directly if DTO allows, otherwise update
      phone: '1234567890',
    });
    // Force update role just in case
    await usersService.update(user.id, { role: 'superadmin' });
  } else {
    console.log(
      `Superadmin ${superEmail} already exists. Resetting password...`,
    );
    const hash = await bcrypt.hash(superPass, 10);
    await usersService.update(superUser.id, {
      passwordHash: hash,
      role: 'superadmin',
    });
  }

  // 3. Create Client (User) for Abastos
  const clientEmail = 'cliente@abastos.com';
  const clientPass = 'Client123!';
  const tenantId = 'abastos-la-frescura';

  const clientUser = await usersService.findByEmail(clientEmail);
  if (!clientUser) {
    console.log(`Creating Client: ${clientEmail}`);
    await usersService.createUserForTenant(tenantId, {
      email: clientEmail,
      password: clientPass,
      firstName: 'Cliente',
      lastName: 'Prueba',
      role: 'user',
      phone: '5555555555',
    });
  } else {
    console.log(`Client ${clientEmail} already exists. Resetting password...`);
    const hash = await bcrypt.hash(clientPass, 10);
    await usersService.update(clientUser.id, { passwordHash: hash });
  }

  console.log('Done!');
  await app.close();
}

bootstrap();
