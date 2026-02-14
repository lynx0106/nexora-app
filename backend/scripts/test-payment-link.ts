import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PaymentsService } from '../src/payments/payments.service';
import { DataSource } from 'typeorm';
import { Order } from '../src/orders/entities/order.entity';
import { Tenant } from '../src/tenants/entities/tenant.entity';
import { Product } from '../src/products/entities/product.entity';
import { User } from '../src/users/entities/user.entity';

async function run() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const paymentsService = app.get(PaymentsService);

  console.log('🚀 Generating Test Payment Link...');

  // 1. Get a tenant
  const tenantRepo = dataSource.getRepository(Tenant);
  const tenant = await tenantRepo.findOne({ where: { } }); // Get first tenant
  if (!tenant) {
    console.error('❌ No tenant found');
    process.exit(1);
  }

  // 2. Create a Mock Order (In memory, or save if needed, but for link gen we just need the object structure mostly)
  // Actually, let's create a real order to be safe with DB relations if service needs it, 
  // but the service just needs the object.
  const order = new Order();
  order.id = 'test-order-' + Date.now();
  order.customerEmail = 'cliente@test.com';
  order.items = [
    { productId: 'prod_123', quantity: 1, price: 1000, product: new Product() } as any
  ];
  
  // Note: We are mocking the Order entity structure required by createPreference
  // Ensure tenant has currency
  tenant.currency = 'COP'; 

  try {
    const result = await paymentsService.createPreference(order, tenant);
    console.log('✅ Preference Created Successfully!');
    console.log('------------------------------------------------');
    console.log('🔗 Link de Pago (Producción):', result.initPoint);
    console.log('🔗 Link de Pago (Sandbox):', result.sandboxInitPoint);
    console.log('------------------------------------------------');
    console.log('⚠️  NOTA: Si usas credenciales de Producción, usa el Link de Producción pero NO pagues con tu propia tarjeta real para evitar bloqueos (o paga un monto mínimo real).');
    console.log('⚠️  NOTA: Si son credenciales de Test, usa Sandbox.');
  } catch (error) {
    console.error('❌ Error generating link:', error);
  }

  await app.close();
}

run();
