
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { UsersController } from '../src/users/users.controller';
import { TenantsController } from '../src/tenants/tenants.controller';
import { AppointmentsController } from '../src/appointments/appointments.controller';
import { OrdersController } from '../src/orders/orders.controller';
import { UsersService } from '../src/users/users.service';
import { TenantsService } from '../src/tenants/tenants.service';
import { ForbiddenException } from '@nestjs/common';

async function verifyAllSecurity() {
  console.log('🔒 Starting Comprehensive Security Verification...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  
  const usersController = app.get(UsersController);
  const tenantsController = app.get(TenantsController);
  const appointmentsController = app.get(AppointmentsController);
  const ordersController = app.get(OrdersController);
  
  const usersService = app.get(UsersService);
  const tenantsService = app.get(TenantsService);

  // Setup Test Data
  const tenantId = 'security-test-tenant';
  // Ensure tenant exists
  let tenant = await tenantsService.findOne(tenantId);
  if (!tenant) {
      const result = await tenantsService.createTenantWithAdmin({
          tenantId,
          name: 'Security Test Restaurant',
          sector: 'restaurante',
          adminEmail: 'admin@security.com',
          adminFirstName: 'Admin',
          adminLastName: 'Test',
          adminPassword: 'password',
          currency: 'USD'
      });
      tenant = result.tenant;
  }

  // Create Users
  let adminUser = await usersService.findByEmail('admin@security.com');
  // Re-fetch to ensure we have the correct object if it was just created (though createTenant returns it inside result, findByEmail is safer)
  
  let normalUser = await usersService.findByEmail('user@security.com');
  if (!normalUser) {
      normalUser = await usersService.createUserForTenant(tenantId, {
          email: 'user@security.com',
          password: 'password',
          firstName: 'User',
          lastName: 'Test',
          role: 'user',
          phone: '1234567890'
      });
  }

  let hackerUser = await usersService.findByEmail('hacker@security.com');
  if (!hackerUser) {
      hackerUser = await usersService.createUserForTenant(tenantId, {
          email: 'hacker@security.com',
          password: 'password',
          firstName: 'Hacker',
          lastName: 'Test',
          role: 'user',
          phone: '0987654321'
      });
  }

  // Helper to simulate request
  const req = (user: any) => ({
      user: {
          userId: user.id,
          email: user.email,
          tenantId: user.tenantId,
          role: user.role
      }
  });

  console.log('\n--- 1. Tenant Settings Security ---');
  // Test 1.1: Admin updating tables/capacity (Should Succeed)
  try {
      console.log('Testing Admin update tenant settings...');
      if (!adminUser) throw new Error("Admin user not found");
      
      await tenantsController.updateMyTenant(req(adminUser) as any, {
          tablesCount: 20,
          capacity: 80
      });
      const updatedTenant = await tenantsService.findOne(tenantId);
      if (updatedTenant && updatedTenant.tablesCount === 20 && updatedTenant.capacity === 80) {
          console.log('✅ Admin updated tables/capacity successfully');
      } else {
          console.error('❌ Admin update failed to persist');
      }
  } catch (e) {
      console.error('❌ Admin update failed unexpectedly:', e.message);
  }

  // Test 1.2: User updating tenant settings (Should Fail)
  try {
      console.log('Testing User update tenant settings...');
      await tenantsController.updateMyTenant(req(normalUser) as any, {
          capacity: 1000
      });
      console.error('❌ User was able to update tenant settings (Security Breach)');
  } catch (e) {
      if (e instanceof ForbiddenException) {
          console.log('✅ User blocked from updating tenant settings');
      } else {
          console.error('❌ Unexpected error:', e.message);
      }
  }

  console.log('\n--- 2. Team Management Security ---');
  // Test 2.1: User creating another user (Should Fail)
  try {
      console.log('Testing User creating another user...');
      await usersController.create(req(normalUser) as any, {
          firstName: 'New',
          lastName: 'User',
          email: 'new@security.com',
          role: 'user',
          password: 'password'
      });
      console.error('❌ User was able to create a user (Security Breach)');
  } catch (e) {
      if (e instanceof ForbiddenException) {
          console.log('✅ User blocked from creating users');
      } else {
          console.error('❌ Unexpected error:', e.message);
      }
  }

  // Test 2.2: User listing all users (Should see only staff, not other users)
  try {
      console.log('Testing User listing team...');
      const users = await usersController.findAllForTenant(req(normalUser) as any);
      const hasOtherUser = users.some(u => u.email === 'hacker@security.com'); // hacker is role 'user'
      const hasAdmin = users.some(u => u.email === 'admin@security.com'); // admin is role 'admin'
      
      if (!hasOtherUser && hasAdmin) {
          console.log('✅ User sees only staff/admin, not other customers');
      } else if (hasOtherUser) {
          console.error('❌ User sees other customers (Privacy Breach)');
      } else {
          console.log('⚠️ User listing behavior check:', users.length, 'users found');
      }
  } catch (e) {
      console.error('❌ User listing failed:', e.message);
  }

  console.log('\n--- 3. Appointments Security (Restaurant) ---');
  // Test 3.1: User creating appointment for self (Should Succeed)
  try {
      console.log('Testing User creating own reservation...');
      if (!adminUser) throw new Error("Admin user not found");

      const apt = await appointmentsController.create({
          tenantId,
          clientId: normalUser!.id,
          doctorId: adminUser.id, // In restaurant, this might be table or ignored, but required by schema
          dateTime: new Date(Date.now() + 86400000).toISOString(),
          pax: 4,
          occasion: 'cumpleaños',
          serviceId: undefined // Optional
      }, req(normalUser) as any);
      console.log('✅ User created reservation successfully');
      
      // Test 3.2: User updating status (Should Fail)
      try {
          console.log('Testing User updating status...');
          await appointmentsController.updateStatus(apt.id, 'confirmed', req(normalUser) as any);
          console.error('❌ User was able to update status (Security Breach)');
      } catch (e) {
          if (e instanceof ForbiddenException) {
              console.log('✅ User blocked from updating status');
          } else {
              console.error('❌ Unexpected error updating status:', e.message);
          }
      }

  } catch (e) {
      console.error('❌ User creation of reservation failed:', e.message);
  }

  // Test 3.3: User creating reservation for another user (Should Fail)
  try {
      console.log('Testing User creating reservation for OTHER user...');
      if (!adminUser) throw new Error("Admin user not found");
      
      await appointmentsController.create({
          tenantId,
          clientId: hackerUser!.id, // Trying to book for hacker
          doctorId: adminUser.id,
          dateTime: new Date(Date.now() + 86400000).toISOString(),
          pax: 2
      }, req(normalUser) as any);
      // We expect this to fail or override clientId
      // If the controller logic overrides clientId with req.user.id, it's technically safe but misleading.
      // If it blindly trusts clientId, it's a breach.
      console.log('⚠️ User created reservation with different clientId payload.'); 
  } catch (e) {
      console.log('✅ User blocked/failed creating reservation for other');
  }

  await app.close();
  console.log('\nVerification Complete.');
}

verifyAllSecurity();
