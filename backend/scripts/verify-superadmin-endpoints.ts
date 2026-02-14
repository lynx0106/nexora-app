import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { OrdersService } from '../src/orders/orders.service';
import { AppointmentsService } from '../src/appointments/appointments.service';
import { UsersService } from '../src/users/users.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  console.log('--- STARTING SUPERADMIN VERIFICATION ---');

  try {
    // 1. Verify OrdersService.findAllGlobal
    const ordersService = app.get(OrdersService);
    if (ordersService.findAllGlobal) {
        console.log('✅ OrdersService.findAllGlobal method exists.');
        const orders = await ordersService.findAllGlobal();
        console.log(`✅ OrdersService.findAllGlobal returned ${orders.length} orders.`);
        if (orders.length > 0) {
            console.log('   Sample order tenant:', orders[0].tenant ? orders[0].tenant.name : 'No tenant relation');
        }
    } else {
        console.error('❌ OrdersService.findAllGlobal method MISSING!');
    }

    // 2. Verify AppointmentsService (Global Fetch)
    // Note: AppointmentsService might not have a dedicated findAllGlobal, but the controller uses findAllByTenant with logic?
    // Actually, looking at previous context, we added logic to controller/service.
    // Let's check if we can fetch all appointments.
    const appointmentsService = app.get(AppointmentsService);
    console.log('ℹ️  Checking AppointmentsService...');
    // In the frontend we use /appointments/all. Let's see if we can simulate that or if there is a service method.
    // The controller for /all calls appointmentsService.findAllGlobal() if it exists?
    // Let's check if that method exists on service.
    if ((appointmentsService as any).findAllGlobal) {
         console.log('✅ AppointmentsService.findAllGlobal method exists.');
         const appts = await (appointmentsService as any).findAllGlobal();
         console.log(`✅ AppointmentsService.findAllGlobal returned ${appts.length} appointments.`);
    } else {
         console.log('⚠️ AppointmentsService.findAllGlobal method not found (might use different logic).');
    }

    // 3. Verify UsersService.getTenantsSummary (Sector Data)
    const usersService = app.get(UsersService);
    const tenants = await usersService.getTenantsSummary();
    console.log(`✅ UsersService.getTenantsSummary returned ${tenants.length} tenants.`);
    if (tenants.length > 0) {
        const sample = tenants[0];
        console.log(`   Sample tenant: ${sample.name} | Sector: ${sample.sector}`);
        if (!sample.sector) {
            console.error('❌ Tenant sector is MISSING in summary!');
        } else {
            console.log('✅ Tenant sector is present.');
        }
    }

  } catch (error) {
    console.error('❌ Verification Failed:', error);
  } finally {
    await app.close();
    console.log('--- VERIFICATION COMPLETE ---');
  }
}

bootstrap();
