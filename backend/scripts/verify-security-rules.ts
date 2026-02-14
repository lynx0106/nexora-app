import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { UsersService } from '../src/users/users.service';
import { TenantsService } from '../src/tenants/tenants.service';
import { AppointmentsService } from '../src/appointments/appointments.service';
import { OrdersService } from '../src/orders/orders.service';
import { User } from '../src/users/entities/user.entity';
import { Tenant } from '../src/tenants/entities/tenant.entity';
import { AppointmentsController } from '../src/appointments/appointments.controller';
import { OrdersController } from '../src/orders/orders.controller';
import { TenantsController } from '../src/tenants/tenants.controller';
import { ForbiddenException } from '@nestjs/common';

async function verifySecurityRules() {
  console.log('🔒 Starting Security & Role Access Verification...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  
  // Get Controllers directly to simulate request with @Req() user
  const appointmentsController = app.get(AppointmentsController);
  const ordersController = app.get(OrdersController);
  const tenantsController = app.get(TenantsController);
  
  const tenantsService = app.get(TenantsService);
  const usersService = app.get(UsersService);

  try {
    const tenantId = 'security-test-tenant';
    
    // 1. Setup Tenant
    let tenant = await tenantsService.findOne(tenantId);
    if (!tenant) {
        console.log('📝 Creating Security Test Tenant...');
        await tenantsService.createTenantWithAdmin({
            tenantId,
            name: 'Security Test',
            sector: 'retail',
            adminEmail: 'admin@security.com',
            adminFirstName: 'Admin',
            adminLastName: 'Secure',
            adminPassword: 'password123',
            currency: 'USD',
            country: 'US'
        });
    }

    // Ensure dummy service exists
    const productRepo = dataSource.getRepository('Product');
    let service = await productRepo.findOne({ where: { tenantId } });
    if (!service) {
        service = productRepo.create({
            tenantId,
            name: 'Security Service',
            price: 100,
            isActive: true,
            stock: 100
        });
        await productRepo.save(service);
    }

    // 2. Setup Users
    let adminUser = await usersService.findByEmail('admin@security.com');
    if (!adminUser) {
        throw new Error('Admin user not found. Tenant creation might have failed to create admin?');
    }
    
    let normalUser = await usersService.findByEmail('user@security.com');
    if (!normalUser) {
        normalUser = await usersService.createUserForTenant(tenantId, {
            email: 'user@security.com',
            password: 'password123',
            firstName: 'Normal',
            lastName: 'User',
            role: 'user'
        });
    }
    
    if (!normalUser) throw new Error('Failed to create normal user');

    // Mock Request Objects
    const adminReq = { user: { id: adminUser.id, role: 'admin', tenantId } };
    const userReq = { user: { id: normalUser.id, role: 'user', tenantId } };

    console.log('✅ Users setup complete.');

    // --- TEST CASE 1: Appointments Security ---
    console.log('\n🧪 Testing Appointments Security...');
    
    // Admin creates appointment
    const adminAppt = await appointmentsController.create({
        tenantId,
        dateTime: new Date().toISOString(),
        clientId: adminUser.id, // Admin booking for self
        serviceId: service.id, // Use valid service ID
        doctorId: adminUser.id,
    } as any, adminReq);
    
    // User tries to update Admin's appointment
    try {
        await appointmentsController.update(adminAppt.id, { notes: 'Hacked' }, userReq);
        console.error('❌ FAILURE: User was able to update Admin appointment!');
    } catch (e) {
        if (e instanceof ForbiddenException) {
            console.log('✅ SUCCESS: User blocked from updating others appointment.');
        } else {
            console.log('⚠️ Unexpected error (might be DB constraint, which is also fine):', e.message);
        }
    }

    // User tries to update status
    try {
        await appointmentsController.updateStatus(adminAppt.id, 'confirmed', userReq);
        console.error('❌ FAILURE: User was able to update status!');
    } catch (e) {
        if (e instanceof ForbiddenException) {
            console.log('✅ SUCCESS: User blocked from updating status.');
        } else {
             console.log('⚠️ Unexpected error:', e.message);
        }
    }

    // --- TEST CASE 2: Orders Security ---
    console.log('\n🧪 Testing Orders Security...');

    // Create Order (Simulating Service bypass for dependencies to just get an ID)
    // We need a product to create an order properly via Service due to stock check
    // Let's manually insert an order to test Controller security
    const orderRepo = dataSource.getRepository('Order');
    const adminOrder = orderRepo.create({
        tenantId,
        userId: adminUser.id,
        total: 100,
        status: 'pending',
        items: []
    });
    await orderRepo.save(adminOrder);

    // User tries to delete Admin's order
    try {
        await ordersController.remove(adminOrder.id, userReq);
        console.error('❌ FAILURE: User was able to delete Admin order!');
    } catch (e) {
        if (e instanceof ForbiddenException) {
            console.log('✅ SUCCESS: User blocked from deleting others order.');
        } else {
             console.log('⚠️ Unexpected error:', e.message);
        }
    }

    // User tries to change status to 'completed' on their own order
    const userOrder = orderRepo.create({
        tenantId,
        userId: normalUser.id,
        total: 50,
        status: 'pending',
        items: []
    });
    await orderRepo.save(userOrder);

    try {
        await ordersController.update(userOrder.id, { status: 'completed' }, userReq);
        console.error('❌ FAILURE: User was able to complete their own order!');
    } catch (e) {
        if (e instanceof ForbiddenException) {
            console.log('✅ SUCCESS: User blocked from completing order (can only cancel).');
        } else {
             console.log('⚠️ Unexpected error:', e.message);
        }
    }

    // --- TEST CASE 3: Tenant Profile Security ---
    console.log('\n🧪 Testing Tenant Profile Security...');
    try {
        await tenantsController.updateMyTenant(userReq as any, { name: 'Hacked Tenant' });
        console.error('❌ FAILURE: User was able to update Tenant Profile!');
    } catch (e) {
        if (e instanceof ForbiddenException) {
            console.log('✅ SUCCESS: User blocked from updating Tenant Profile.');
        } else {
             console.log('⚠️ Unexpected error:', e.message);
        }
    }

    console.log('\n🎉 Security Verification Completed!');

  } catch (error) {
    console.error('❌ Verification Script Failed:', error);
  } finally {
    await app.close();
  }
}

verifySecurityRules();
