import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { OrdersService } from '../src/orders/orders.service';
import { AppointmentsService } from '../src/appointments/appointments.service';
import { ProductsService } from '../src/products/products.service';
import { UsersService } from '../src/users/users.service';
import { PublicService } from '../src/public/public.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  const ordersService = app.get(OrdersService);
  const appointmentsService = app.get(AppointmentsService);
  const productsService = app.get(ProductsService);
  const usersService = app.get(UsersService);
  const publicService = app.get(PublicService);

  console.log('Simulating activity (Orders & Appointments)...');

  const tenants = [
    { id: 'abastos-la-frescura', type: 'retail' },
    { id: 'pet-friends', type: 'hybrid' },
    { id: 'moda-urbana', type: 'retail' },
    { id: 'tech-master', type: 'hybrid' },
    { id: 'belleza-plus', type: 'service' },
    { id: 'clinica-dental-vital', type: 'service' },
  ];

  const randomClients = [
    { firstName: 'Maria', lastName: 'Gomez', email: 'maria@test.com' },
    { firstName: 'Carlos', lastName: 'Perez', email: 'carlos@test.com' },
    { firstName: 'Ana', lastName: 'Lopez', email: 'ana@test.com' },
    { firstName: 'Juan', lastName: 'Diaz', email: 'juan@test.com' },
    { firstName: 'Sofia', lastName: 'Ruiz', email: 'sofia@test.com' },
  ];

  // Helper to get or create client
  const getClient = async (tenantId: string, clientData: any) => {
    // Check if user exists in DB globally or per tenant?
    // UsersService.findByEmail returns global user.
    // We need to ensure they are linked to tenant if we want specific logic,
    // but for public booking/orders we just need a user ID.
    // Let's use publicService.createAppointment logic which handles client creation/finding.
    // But for orders we need a user entity.

    let user = await usersService.findByEmail(clientData.email);
    if (!user) {
      user = await usersService.createUserForTenant(tenantId, {
        ...clientData,
        password: 'password123',
        role: 'user',
        phone: '555-0000',
      });
      const { passwordHash, ...safeUser } = user;
      console.log(`Created client ${safeUser.email} for ${tenantId}`);
      return safeUser;
    }
    return user;
  };

  for (const tenant of tenants) {
    console.log(`Processing ${tenant.id} (${tenant.type})...`);

    let products = await productsService.findAllByTenant(tenant.id);

    // TEMPORARY: Wipe products for specific tenants to ensure fresh seed with new data
    const tenantsToReset = [
      'abastos-la-frescura',
      'pet-friends',
      'moda-urbana',
      'tech-master',
    ];
    if (tenantsToReset.includes(tenant.id)) {
      console.log(`Resetting data for ${tenant.id}...`);

      // 1. Delete existing orders and appointments first to avoid foreign key constraints
      await ordersService.removeAllByTenant(tenant.id);
      await appointmentsService.removeAllByTenant(tenant.id);

      // 2. Delete products
      if (products.length > 0) {
        for (const p of products) {
          await productsService.remove(p.id, tenant.id);
        }
        products = [];
      }
    }

    if (products.length === 0) {
      console.log(`No products found for ${tenant.id}, attempting to seed...`);
      // Ensure tenant exists first?
      // If tenant doesn't exist, productsService.seedProducts might fail if foreign key constraint?
      // Actually productsService.seedProducts just inserts with tenantId.
      // But we need to ensure Tenant exists.
      // Let's assume tenants exist or just try to seed.
      // For Belleza and Dental, productsService has hardcoded seeds.
      await productsService.seedProducts(tenant.id);
      products = await productsService.findAllByTenant(tenant.id);
    }

    if (products.length === 0) {
      console.log(`Still no products for ${tenant.id}, skipping.`);
      continue;
    }

    console.log(`Found ${products.length} products for ${tenant.id}.`);
    const debugServices = products.filter((p) => p.duration && p.duration > 0);
    console.log(`- Services (duration > 0): ${debugServices.length}`);
    const debugItems = products.filter((p) => !p.duration);
    console.log(`- Items (no duration): ${debugItems.length}`);

    // 1. Simulate Orders (Retail & Hybrid)
    if (tenant.type === 'retail' || tenant.type === 'hybrid') {
      const saleProducts = products.filter((p) => !p.duration); // Items without duration are products
      if (saleProducts.length > 0) {
        console.log(`Creating 5 orders for ${tenant.id}...`);
        for (let i = 0; i < 5; i++) {
          const clientData =
            randomClients[Math.floor(Math.random() * randomClients.length)];
          const client = await getClient(tenant.id, clientData); // Ensure client exists

          // Pick random products
          const items: {
            productId: string;
            quantity: number;
            price: number;
          }[] = [];
          const numItems = Math.floor(Math.random() * 3) + 1;
          for (let j = 0; j < numItems; j++) {
            const prod =
              saleProducts[Math.floor(Math.random() * saleProducts.length)];
            items.push({
              productId: prod.id,
              quantity: Math.floor(Math.random() * 2) + 1,
              price: Number(prod.price),
            });
          }

          await ordersService.create({
            tenantId: tenant.id,
            userId: client.id,
            items,
          });
        }
      }
    }

    // 2. Simulate Appointments (Service & Hybrid)
    if (tenant.type === 'service' || tenant.type === 'hybrid') {
      const services = products.filter((p) => p.duration && p.duration > 0);
      if (services.length > 0) {
        console.log(`Creating 3 appointments for ${tenant.id}...`);
        for (let i = 0; i < 3; i++) {
          const clientData =
            randomClients[Math.floor(Math.random() * randomClients.length)];
          const service = services[Math.floor(Math.random() * services.length)];

          // Date: Tomorrow or Next Day
          const date = new Date();
          date.setDate(date.getDate() + Math.floor(Math.random() * 5) + 1);
          date.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0);

          try {
            await publicService.createAppointment(tenant.id, {
              serviceId: service.id,
              dateTime: date.toISOString(),
              client: clientData,
            });
          } catch (e) {
            console.log(`Skipped appointment slot (conflict): ${e.message}`);
          }
        }
      }
    }
  }

  console.log('Simulation completed!');
  await app.close();
}

bootstrap();
