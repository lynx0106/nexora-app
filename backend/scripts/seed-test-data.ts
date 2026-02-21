/**
 * Script para crear datos de prueba completos para testing de App Móvil Nexora
 * Uso: npx ts-node scripts/seed-test-data.ts
 * 
 * Crea:
 * - 1 Superadmin
 * - 4 Empresas (Tenants) con datos completos
 * - Usuarios admin y staff para cada empresa
 * - Productos/Servicios
 * - Pedidos/Citas de prueba
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { UsersService } from '../src/users/users.service';
import { TenantsService } from '../src/tenants/tenants.service';
import { ProductsService } from '../src/products/products.service';
import { OrdersService } from '../src/orders/orders.service';
import { AppointmentsService } from '../src/appointments/appointments.service';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

interface TestTenant {
  id: string;
  name: string;
  sector: string;
  country: string;
  currency: string;
  adminEmail: string;
  adminPassword: string;
  staff: Array<{
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    password: string;
  }>;
  products: Array<{
    name: string;
    description: string;
    price: number;
    duration?: number;
    stock?: number;
  }>;
  isServiceBased: boolean; // true = citas, false = pedidos
}

const TEST_PASSWORD = 'Admin123!';

const TEST_TENANTS: TestTenant[] = [
  {
    id: 'restaurante-sabor',
    name: 'Restaurante El Sabor',
    sector: 'restaurante',
    country: 'Colombia',
    currency: 'COP',
    adminEmail: 'admin@sabor.com',
    adminPassword: TEST_PASSWORD,
    staff: [
      { email: 'mesero1@sabor.com', firstName: 'Carlos', lastName: 'Mesero', role: 'user', password: TEST_PASSWORD },
      { email: 'cocina@sabor.com', firstName: 'Maria', lastName: 'Cocina', role: 'user', password: TEST_PASSWORD },
      { email: 'caja@sabor.com', firstName: 'Juan', lastName: 'Caja', role: 'user', password: TEST_PASSWORD },
    ],
    products: [
      { name: 'Bandeja Paisa', description: 'Arroz, frijoles, carne molida, chicharrón, huevo, aguacate y arepa', price: 25000, stock: 50 },
      { name: 'Ajiaco Santafereño', description: 'Sopa tradicional con pollo, mazorca, papa y alcaparras', price: 18000, stock: 30 },
      { name: 'Empanadas Colombianas', description: 'Empanadas de carne y papa (3 unidades)', price: 8000, stock: 100 },
      { name: 'Arepa con Queso', description: 'Arepa asada con queso derretido', price: 5000, stock: 80 },
      { name: 'Churrasco', description: 'Carne a la parrilla con papas y ensalada', price: 32000, stock: 40 },
      { name: 'Pescado Frito', description: 'Mojarra frita con arroz de coco y patacones', price: 28000, stock: 25 },
      { name: 'Limonada Natural', description: 'Limonada con hierbabuena', price: 6000, stock: 200 },
      { name: 'Jugo de Mango', description: 'Jugo natural de mango en leche o agua', price: 7000, stock: 150 },
      { name: 'Cerveza Nacional', description: 'Cerveza águila o club colombia', price: 5000, stock: 300 },
      { name: 'Postre de Tres Leches', description: 'Torta de tres leches con arequipe', price: 9000, stock: 40 },
      { name: 'Flan de Caramelo', description: 'Flan casero con salsa de caramelo', price: 7500, stock: 35 },
      { name: 'Sopa de Lentejas', description: 'Sopa de lentejas con verduras', price: 12000, stock: 45 },
      { name: 'Pollo a la Plancha', description: 'Pechuga de pollo con vegetales salteados', price: 22000, stock: 60 },
      { name: 'Arroz con Pollo', description: 'Arroz amarillo con pollo desmechado y verduras', price: 20000, stock: 55 },
      { name: 'Gaseosa 400ml', description: 'Coca-cola, sprite o postobón', price: 4500, stock: 500 },
    ],
    isServiceBased: false,
  },
  {
    id: 'clinica-sonrisa',
    name: 'Clínica Dental Sonrisa Perfecta',
    sector: 'salud',
    country: 'Colombia',
    currency: 'COP',
    adminEmail: 'admin@sonrisa.com',
    adminPassword: TEST_PASSWORD,
    staff: [
      { email: 'doctor@sonrisa.com', firstName: 'Dr. Fernando', lastName: 'Gómez', role: 'user', password: TEST_PASSWORD },
      { email: 'recepcion@sonrisa.com', firstName: 'Ana', lastName: 'Recepción', role: 'user', password: TEST_PASSWORD },
      { email: 'asistente@sonrisa.com', firstName: 'Laura', lastName: 'Asistente', role: 'user', password: TEST_PASSWORD },
    ],
    products: [
      { name: 'Limpieza Dental Profunda', description: 'Eliminación de placa y sarro, pulido dental', price: 80000, duration: 60 },
      { name: 'Blanqueamiento Dental', description: 'Blanqueamiento profesional con lámpara LED', price: 350000, duration: 90 },
      { name: 'Ortodoncia Brackets', description: 'Instalación de brackets metálicos', price: 2800000, duration: 120 },
      { name: 'Ortodoncia Invisible', description: 'Alineadores transparentes Invisalign', price: 4500000, duration: 60 },
      { name: 'Implante Dental', description: 'Implante de titanio con corona', price: 2500000, duration: 180 },
      { name: 'Endodoncia', description: 'Tratamiento de conducto', price: 450000, duration: 90 },
      { name: 'Extracción Simple', description: 'Extracción de pieza dental', price: 120000, duration: 45 },
      { name: 'Extracción de Muela del Juicio', description: 'Cirugía de terceros molares', price: 450000, duration: 120 },
      { name: 'Corona Dental', description: 'Corona en porcelana o zirconio', price: 850000, duration: 60 },
      { name: 'Puente Dental', description: 'Puente fijo de 3 unidades', price: 2200000, duration: 90 },
      { name: 'Prótesis Removible', description: 'Prótesis parcial o completa', price: 1200000, duration: 60 },
      { name: 'Carillas de Porcelana', description: 'Carillas estéticas (por unidad)', price: 950000, duration: 60 },
    ],
    isServiceBased: true,
  },
  {
    id: 'fashion-store',
    name: 'Fashion Store',
    sector: 'retail',
    country: 'Colombia',
    currency: 'COP',
    adminEmail: 'admin@fashion.com',
    adminPassword: TEST_PASSWORD,
    staff: [
      { email: 'vendedor@fashion.com', firstName: 'Pedro', lastName: 'Vendedor', role: 'user', password: TEST_PASSWORD },
      { email: 'cajera@fashion.com', firstName: 'Sofia', lastName: 'Cajera', role: 'user', password: TEST_PASSWORD },
      { email: 'bodega@fashion.com', firstName: 'Diego', lastName: 'Bodega', role: 'user', password: TEST_PASSWORD },
    ],
    products: [
      { name: 'Camiseta Básica Blanca', description: 'Camiseta 100% algodón', price: 45000, stock: 100 },
      { name: 'Camiseta Básica Negra', description: 'Camiseta 100% algodón', price: 45000, stock: 100 },
      { name: 'Jeans Slim Fit Azul', description: 'Jeans ajustados color azul oscuro', price: 120000, stock: 60 },
      { name: 'Jeans Clásico Negro', description: 'Jeans corte clásico negro', price: 115000, stock: 55 },
      { name: 'Chaqueta de Cuero', description: 'Chaqueta sintética tipo cuero', price: 180000, stock: 30 },
      { name: 'Sudadera con Capucha', description: 'Hoodie en algodón', price: 95000, stock: 80 },
      { name: 'Vestido Casual', description: 'Vestido de verano estampado', price: 85000, stock: 45 },
      { name: 'Blusa Elegante', description: 'Blusa para ocasión formal', price: 75000, stock: 50 },
      { name: 'Zapatos Deportivos', description: 'Tenis running', price: 180000, stock: 40 },
      { name: 'Zapatos Formales', description: 'Zapatos de cuero para oficina', price: 220000, stock: 35 },
      { name: 'Sandalias', description: 'Sandalias de verano', price: 65000, stock: 70 },
      { name: 'Cinturón de Cuero', description: 'Cinturón genuino negro y café', price: 55000, stock: 90 },
      { name: 'Gorra Snapback', description: 'Gorra ajustable varios colores', price: 45000, stock: 120 },
      { name: 'Bufanda de Lana', description: 'Bufanda tejida', price: 38000, stock: 60 },
      { name: 'Medias Pack x3', description: 'Pack de medias deportivas', price: 25000, stock: 200 },
    ],
    isServiceBased: false,
  },
  {
    id: 'barberia-estilo',
    name: 'Barbería Estilo Urbano',
    sector: 'belleza',
    country: 'Colombia',
    currency: 'COP',
    adminEmail: 'admin@estilo.com',
    adminPassword: TEST_PASSWORD,
    staff: [
      { email: 'barbero1@estilo.com', firstName: 'Luis', lastName: 'Barbero', role: 'user', password: TEST_PASSWORD },
      { email: 'barbero2@estilo.com', firstName: 'Andrés', lastName: 'Estilista', role: 'user', password: TEST_PASSWORD },
      { email: 'recepcion@estilo.com', firstName: 'Camila', lastName: 'Recepción', role: 'user', password: TEST_PASSWORD },
    ],
    products: [
      { name: 'Corte Clásico', description: 'Corte de cabello tradicional con tijera', price: 25000, duration: 45 },
      { name: 'Corte Moderno', description: 'Corte con diseño y degradado', price: 30000, duration: 60 },
      { name: 'Afeitado Tradicional', description: 'Afeitado con navaja y toalla caliente', price: 20000, duration: 30 },
      { name: 'Afeitado con Diseño', description: 'Afeitado con diseño de barba', price: 28000, duration: 45 },
      { name: 'Arreglo de Barba', description: 'Perfilado y cuidado de barba', price: 18000, duration: 30 },
      { name: 'Corte + Barba', description: 'Combo corte de cabello y arreglo de barba', price: 40000, duration: 75 },
      { name: 'Tratamiento Facial', description: 'Limpieza facial para hombres', price: 35000, duration: 45 },
      { name: 'Coloración', description: 'Tinte de cabello completo', price: 55000, duration: 90 },
      { name: 'Mechas/Reflejos', description: 'Mechas o reflejos en cabello', price: 75000, duration: 120 },
      { name: 'Tratamiento Capilar', description: 'Hidratación y tratamiento profundo', price: 45000, duration: 60 },
      { name: 'Corte Infantil', description: 'Corte para niños hasta 12 años', price: 20000, duration: 40 },
      { name: 'Paquete Novio', description: 'Corte, afeitado, facial y styling', price: 85000, duration: 120 },
    ],
    isServiceBased: true,
  },
];

async function bootstrap() {
  console.log('===========================================');
  console.log('🚀 NEXORA - SEED DE DATOS DE PRUEBA');
  console.log('===========================================');
  console.log('');

  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const tenantsService = app.get(TenantsService);
  const productsService = app.get(ProductsService);
  const ordersService = app.get(OrdersService);
  const appointmentsService = app.get(AppointmentsService);
  const dataSource = app.get(DataSource);

  const createdUsers: Array<{ email: string; password: string; role: string; tenant: string }> = [];

  try {
    // ============================================
    // 1. CREAR SUPERADMIN
    // ============================================
    console.log('👑 Creando Superadmin...');
    const superEmail = 'superadmin@nexora.app';
    const superPass = 'SuperAdmin2025!';

    let superUser = await usersService.findByEmail(superEmail);
    if (!superUser) {
      const passwordHash = await bcrypt.hash(superPass, 10);
      superUser = await usersService.createUser({
        email: superEmail,
        firstName: 'Super',
        lastName: 'Admin',
        passwordHash,
        role: 'superadmin',
        tenantId: 'system',
        isActive: true,
      });
      console.log(`✅ Superadmin creado: ${superEmail}`);
    } else {
      const passwordHash = await bcrypt.hash(superPass, 10);
      await usersService.update(superUser.id, { passwordHash, role: 'superadmin' });
      console.log(`✅ Superadmin actualizado: ${superEmail}`);
    }
    createdUsers.push({ email: superEmail, password: superPass, role: 'superadmin', tenant: 'system' });

    // ============================================
    // 2. CREAR TENANTS Y SUS DATOS
    // ============================================
    for (const tenantData of TEST_TENANTS) {
      console.log(`\n🏢 Procesando: ${tenantData.name}`);

      // 2.1 Crear o verificar tenant
      let tenant = await tenantsService.findOne(tenantData.id);
      if (!tenant) {
        const result = await tenantsService.createTenantWithAdmin({
          tenantId: tenantData.id,
          name: tenantData.name,
          sector: tenantData.sector,
          country: tenantData.country,
          currency: tenantData.currency,
          adminEmail: tenantData.adminEmail,
          adminPassword: tenantData.adminPassword,
          adminFirstName: 'Admin',
          adminLastName: tenantData.name.split(' ').slice(-1)[0],
        });
        tenant = result.tenant;
        console.log(`  ✅ Tenant creado: ${tenantData.id}`);
        console.log(`  ✅ Admin creado: ${tenantData.adminEmail}`);
      } else {
        console.log(`  ℹ️ Tenant ya existe: ${tenantData.id}`);
        // Actualizar password del admin
        const adminUser = await usersService.findByEmail(tenantData.adminEmail);
        if (adminUser) {
          const passwordHash = await bcrypt.hash(tenantData.adminPassword, 10);
          await usersService.update(adminUser.id, { passwordHash });
          console.log(`  ✅ Password de admin actualizado`);
        }
      }
      createdUsers.push({ email: tenantData.adminEmail, password: tenantData.adminPassword, role: 'admin', tenant: tenantData.id });

      // 2.2 Crear usuarios staff
      for (const staff of tenantData.staff) {
        const existing = await usersService.findByEmail(staff.email);
        if (!existing) {
          await usersService.createUserForTenant(tenantData.id, {
            email: staff.email,
            password: staff.password,
            firstName: staff.firstName,
            lastName: staff.lastName,
            role: staff.role,
          });
          console.log(`  ✅ Staff creado: ${staff.email}`);
        } else {
          const passwordHash = await bcrypt.hash(staff.password, 10);
          await usersService.update(existing.id, { passwordHash });
          console.log(`  ℹ️ Staff actualizado: ${staff.email}`);
        }
        createdUsers.push({ email: staff.email, password: staff.password, role: staff.role, tenant: tenantData.id });
      }

      // 2.3 Crear productos/servicios
      const existingProducts = await productsService.findAllByTenant(tenantData.id);
      if (existingProducts.length === 0) {
        for (const productData of tenantData.products) {
          await productsService.create({
            ...productData,
            tenantId: tenantData.id,
            isActive: true,
          });
        }
        console.log(`  ✅ ${tenantData.products.length} productos/servicios creados`);
      } else {
        console.log(`  ℹ️ Productos ya existen (${existingProducts.length})`);
      }

      // 2.4 Crear pedidos/citas de prueba
      if (tenantData.isServiceBased) {
        // Crear citas para servicios
        const services = await productsService.findAllByTenant(tenantData.id);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        for (let i = 0; i < 8; i++) {
          const service = services[i % services.length];
          const appointmentDate = new Date(tomorrow);
          appointmentDate.setDate(appointmentDate.getDate() + Math.floor(i / 2));
          appointmentDate.setHours(9 + (i % 6), 0, 0, 0);

          try {
            await appointmentsService.create({
              tenantId: tenantData.id,
              serviceId: service.id,
              dateTime: appointmentDate.toISOString(),
              clientId: '00000000-0000-0000-0000-000000000000', // System/placeholder client
              notes: 'Cita de prueba automática',
            });
          } catch (e) {
            // Ignorar errores de citas duplicadas
          }
        }
        console.log(`  ✅ Citas de prueba creadas`);
      } else {
        // Crear pedidos para productos
        const products = await productsService.findAllByTenant(tenantData.id);
        
        for (let i = 0; i < 8; i++) {
          const product1 = products[i % products.length];
          const product2 = products[(i + 1) % products.length];

          try {
            await ordersService.create({
              tenantId: tenantData.id,
              items: [
                { productId: product1.id, quantity: Math.floor(Math.random() * 3) + 1 },
                { productId: product2.id, quantity: Math.floor(Math.random() * 2) + 1 },
              ],
              customerEmail: `cliente${i + 1}@test.com`,
              customerName: `Cliente${i + 1} Prueba`,
              publicAccess: true,
            });
          } catch (e) {
            // Ignorar errores
          }
        }
        console.log(`  ✅ Pedidos de prueba creados`);
      }
    }

    // ============================================
    // 3. RESUMEN FINAL
    // ============================================
    console.log('\n===========================================');
    console.log('✅ SEED COMPLETADO EXITOSAMENTE');
    console.log('===========================================');
    console.log('\n📋 CREDENCIALES DE PRUEBA:\n');

    console.log('👑 SUPERADMIN:');
    console.log(`   Email:    superadmin@nexora.app`);
    console.log(`   Password: SuperAdmin2025!`);
    console.log(`   Rol:      superadmin`);
    console.log('');

    // Agrupar por tenant
    const byTenant: Record<string, typeof createdUsers> = {};
    for (const user of createdUsers) {
      if (user.tenant !== 'system') {
        if (!byTenant[user.tenant]) byTenant[user.tenant] = [];
        byTenant[user.tenant].push(user);
      }
    }

    for (const [tenantId, users] of Object.entries(byTenant)) {
      console.log(`🏢 ${tenantId.toUpperCase()}:`);
      for (const user of users) {
        console.log(`   ${user.role === 'admin' ? '👤 Admin:' : '   Staff:'} ${user.email} / ${user.password}`);
      }
      console.log('');
    }

    console.log('===========================================');
    console.log('📝 NOTAS:');
    console.log('   - Todos los usuarios usan la contraseña: Admin123!');
    console.log('   - El superadmin usa: SuperAdmin2025!');
    console.log('   - Los usuarios pueden hacer login desde la app móvil');
    console.log('   - Datos creados para testing, se pueden limpiar después');
    console.log('===========================================');

  } catch (error) {
    console.error('\n❌ Error en el seed:', error);
    throw error;
  } finally {
    await app.close();
  }
}

bootstrap();
