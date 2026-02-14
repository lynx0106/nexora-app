import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/users/entities/user.entity';
import { Tenant } from '../src/tenants/entities/tenant.entity';
import { Product } from '../src/products/entities/product.entity';
import { Appointment } from '../src/appointments/entities/appointment.entity';
import { Order } from '../src/orders/entities/order.entity';
import { OrderItem } from '../src/orders/entities/order-item.entity';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('--- Starting Comprehensive Seed ---');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  const CREDENTIALS_FILE = path.join(process.cwd(), 'pruebas-finales.md');
  let markdownContent = `# Pruebas Finales - Credenciales de Acceso

Este documento contiene las credenciales de todos los usuarios generados para las pruebas manuales.

---

`;

  try {
    // 0. Clean EVERYTHING except system
    console.log('0. Cleaning Database...');
    const preservedTenants = ['system'];

    await queryRunner.manager
      .createQueryBuilder()
      .delete()
      .from(OrderItem)
      .execute(); // Delete all order items

    await queryRunner.manager
      .createQueryBuilder()
      .delete()
      .from(Order)
      .execute(); // Delete all orders

    await queryRunner.manager
      .createQueryBuilder()
      .delete()
      .from(Appointment)
      .execute(); // Delete all appointments

    await queryRunner.manager
      .createQueryBuilder()
      .delete()
      .from(Product)
      .execute(); // Delete all products

    // Delete users except superadmin/system (will recreate superadmin later to ensure fresh data or keep if preserved)
    // Actually let's delete all non-system users
    await queryRunner.manager
      .createQueryBuilder()
      .delete()
      .from(User)
      .where('email != :email', { email: 'superadmin@saas.com' })
      .execute();

    // Delete tenants except system
    await queryRunner.manager
      .createQueryBuilder()
      .delete()
      .from(Tenant)
      .where('id NOT IN (:...tenants)', { tenants: preservedTenants })
      .execute();

    console.log('Database Cleaned.');

    // 1. Superadmin (Ensure exists)
    console.log('1. Ensuring Superadmin...');
    const superPass = 'Super123!';
    const superHash = await bcrypt.hash(superPass, 10);
    
    // Check if system tenant exists
    let systemTenant = await queryRunner.manager.findOne(Tenant, { where: { id: 'system' } });
    if (!systemTenant) {
        systemTenant = queryRunner.manager.create(Tenant, {
            id: 'system',
            name: 'System',
            sector: 'technology',
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        await queryRunner.manager.save(systemTenant);
    }

    let superAdmin = await queryRunner.manager.findOne(User, { where: { email: 'superadmin@saas.com' } });
    if (!superAdmin) {
        superAdmin = queryRunner.manager.create(User, {
            firstName: 'Super',
            lastName: 'Admin',
            email: 'superadmin@saas.com',
            passwordHash: superHash,
            role: 'superadmin',
            tenantId: 'system',
            isActive: true,
        });
        await queryRunner.manager.save(superAdmin);
    } else {
        superAdmin.passwordHash = superHash;
        await queryRunner.manager.save(superAdmin);
    }

    markdownContent += `## Super Admin
| Rol | Email | Password |
|---|---|---|
| **Superadmin** | superadmin@saas.com | ${superPass} |

---

`;

    // 2. Define Companies
    const companies = [
        {
            id: 'restaurante-sabor',
            name: 'Restaurante Sabor Latino',
            sector: 'restaurante',
            admin: { first: 'Carlos', last: 'Chef', email: 'admin@sabor.com' },
            staff: [
                { first: 'Maria', last: 'Mesera', role: 'support' }, // Staff/Mesero
                { first: 'Juan', last: 'Cocina', role: 'support' },
                { first: 'Pedro', last: 'Caja', role: 'admin' } // Encargado
            ],
            products: [
                { name: 'Bandeja Paisa', price: 25, desc: 'Frijoles, arroz, chicharron, carne molida.' },
                { name: 'Ajiaco Santafereño', price: 20, desc: 'Sopa de pollo con tres tipos de papa.' },
                { name: 'Jugo Natural', price: 5, desc: 'Mora, Lulo, Maracuya en agua o leche.' }
            ],
            services: [] // Restaurants usually have products (menu) but can have reservations (appointments)
        },
        {
            id: 'clinica-dental-sonrisas',
            name: 'Clínica Dental Sonrisas',
            sector: 'salud',
            admin: { first: 'Ana', last: 'Directora', email: 'admin@sonrisas.com' },
            staff: [
                { first: 'Dra. Laura', last: 'Ortodoncia', role: 'doctor' },
                { first: 'Dr. Mario', last: 'General', role: 'doctor' },
                { first: 'Sofia', last: 'Recepcion', role: 'support' }
            ],
            products: [], // Services mainly
            services: [
                { name: 'Limpieza Dental', price: 50, duration: 60, desc: 'Limpieza profunda con ultrasonido.' },
                { name: 'Blanqueamiento', price: 200, duration: 90, desc: 'Blanqueamiento laser.' },
                { name: 'Consulta General', price: 30, duration: 30, desc: 'Valoración inicial.' }
            ]
        },
        {
            id: 'tienda-moda-urbana',
            name: 'Moda Urbana Store',
            sector: 'retail',
            admin: { first: 'Luisa', last: 'Gerente', email: 'admin@moda.com' },
            staff: [
                { first: 'Andres', last: 'Ventas', role: 'support' },
                { first: 'Camila', last: 'Ventas', role: 'support' },
                { first: 'Roberto', last: 'Bodega', role: 'support' }
            ],
            products: [
                { name: 'Camiseta Oversize', price: 35, desc: 'Algodón 100%, estampado gráfico.' },
                { name: 'Jean Slim Fit', price: 60, desc: 'Denim azul oscuro.' },
                { name: 'Zapatillas Urbanas', price: 90, desc: 'Estilo skate, suela caucho.' }
            ],
            services: []
        },
        {
            id: 'pizzeria-napoli',
            name: 'Pizzería Napoli',
            sector: 'restaurante',
            admin: { first: 'Marco', last: 'Pizzaiolo', email: 'admin@napoli.com' },
            staff: [
                { first: 'Luigi', last: 'Hornero', role: 'support' },
                { first: 'Mario', last: 'Domicilios', role: 'support' },
                { first: 'Peach', last: 'Caja', role: 'admin' }
            ],
            products: [
                { name: 'Pizza Margarita', price: 12, desc: 'Tomate, mozzarella, albahaca.' },
                { name: 'Pizza Pepperoni', price: 14, desc: 'Doble pepperoni.' },
                { name: 'Pizza Hawaiana', price: 13, desc: 'Piña y jamón (polémica).' }
            ],
            services: []
        },
        {
            id: 'salon-belleza-glam',
            name: 'Glamour Beauty Salon',
            sector: 'belleza',
            admin: { first: 'Valentina', last: 'Stylist', email: 'admin@glam.com' },
            staff: [
                { first: 'Jorge', last: 'Corte', role: 'doctor' }, // Stylists often act like doctors (appointments)
                { first: 'Lucia', last: 'Manicure', role: 'doctor' },
                { first: 'Carmen', last: 'Auxiliar', role: 'support' }
            ],
            products: [],
            services: [
                { name: 'Corte de Cabello', price: 25, duration: 45, desc: 'Lavado y corte.' },
                { name: 'Manicure Spa', price: 15, duration: 40, desc: 'Limpieza y esmaltado.' },
                { name: 'Tinte Completo', price: 80, duration: 120, desc: 'Coloración permanente.' }
            ]
        }
    ];

    const commonPassword = 'Password123!';
    const commonHash = await bcrypt.hash(commonPassword, 10);

    for (const company of companies) {
        console.log(`Processing ${company.name}...`);
        
        // Create Tenant
        const tenant = queryRunner.manager.create(Tenant, {
            id: company.id,
            name: company.name,
            sector: company.sector,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        await queryRunner.manager.save(tenant);

        markdownContent += `## ${company.name} (${company.sector})
**Tenant ID:** \`${company.id}\`

### Personal Administrativo
| Nombre | Rol | Email | Password |
|---|---|---|---|
`;

        // Create Admin
        const adminUser = queryRunner.manager.create(User, {
            firstName: company.admin.first,
            lastName: company.admin.last,
            email: company.admin.email,
            passwordHash: commonHash,
            role: 'admin',
            tenantId: company.id,
            isActive: true,
        });
        await queryRunner.manager.save(adminUser);
        markdownContent += `| ${company.admin.first} ${company.admin.last} | **Admin** | ${company.admin.email} | ${commonPassword} |\n`;

        // Create Staff
        for (const member of company.staff) {
            const email = `${member.first.toLowerCase()}@${company.id.split('-')[0]}.com`;
            const staffUser = queryRunner.manager.create(User, {
                firstName: member.first,
                lastName: member.last,
                email: email,
                passwordHash: commonHash,
                role: member.role,
                tenantId: company.id,
                isActive: true,
            });
            await queryRunner.manager.save(staffUser);
            markdownContent += `| ${member.first} ${member.last} | ${member.role} | ${email} | ${commonPassword} |\n`;
        }

        markdownContent += `\n### Clientes Finales\n| Nombre | Email | Password | Acción Realizada |\n|---|---|---|---|\n`;

        // Create Products/Services
        const createdProducts: Product[] = [];
        const items = [...(company.products || []), ...(company.services || [])];
        for (const item of items) {
            const product = queryRunner.manager.create(Product, {
                name: item.name,
                description: item.desc,
                price: item.price,
                duration: (item as any).duration || null,
                tenantId: company.id,
                isActive: true,
                imageUrl: `https://placehold.co/600x400/22c55e/ffffff?text=${encodeURIComponent(item.name.split(' ')[0])}`,
            });
            createdProducts.push(await queryRunner.manager.save(product));
        }

        // Create 4 Clients and simulate actions
        for (let i = 1; i <= 4; i++) {
            const clientEmail = `cliente${i}.${company.id.split('-')[0]}@gmail.com`;
            const clientUser = queryRunner.manager.create(User, {
                firstName: `Cliente${i}`,
                lastName: `Test`,
                email: clientEmail,
                passwordHash: commonHash,
                role: 'user',
                tenantId: company.id, // Linked to tenant for simplicity in finding them
                isActive: true,
                phone: `555000${i}`,
                address: `Calle ${i} # 10-${i}`
            });
            const savedClient = await queryRunner.manager.save(clientUser);

            let actionDesc = '';

            // Simulate Action based on sector
            if (company.sector === 'restaurante' || company.sector === 'retail') {
                // Create Order
                const randomProduct = createdProducts[Math.floor(Math.random() * createdProducts.length)];
                const order = queryRunner.manager.create(Order, {
                    tenantId: company.id,
                    clientId: savedClient.id,
                    total: randomProduct.price,
                    status: 'pending',
                    createdAt: new Date(),
                });
                const savedOrder = await queryRunner.manager.save(order);
                
                const orderItem = queryRunner.manager.create(OrderItem, {
                    orderId: savedOrder.id,
                    productId: randomProduct.id,
                    quantity: 1,
                    price: randomProduct.price,
                });
                await queryRunner.manager.save(orderItem);
                actionDesc = `Pedido creado (${randomProduct.name})`;
            } else {
                // Create Appointment (Service/Salud/Belleza)
                const randomService = createdProducts[Math.floor(Math.random() * createdProducts.length)];
                // Find a doctor
                const doctor = await queryRunner.manager.findOne(User, { 
                    where: { tenantId: company.id, role: 'doctor' } 
                }) || adminUser; // Fallback to admin if no doctor

                const appointment = queryRunner.manager.create(Appointment, {
                    tenantId: company.id,
                    clientId: savedClient.id,
                    doctorId: doctor.id,
                    serviceId: randomService.id,
                    dateTime: new Date(Date.now() + 86400000 * i), // + i days
                    status: 'confirmed',
                    notes: 'Reserva de prueba seed',
                    pax: company.sector === 'restaurante' ? 2 : undefined,
                    occasion: company.sector === 'restaurante' ? 'Cena' : undefined,
                });
                await queryRunner.manager.save(appointment);
                actionDesc = `Cita agendada (${randomService.name})`;
            }

            markdownContent += `| Cliente ${i} | ${clientEmail} | ${commonPassword} | ${actionDesc} |\n`;
        }
        markdownContent += `\n---\n\n`;
    }

    // Write Markdown File
    fs.writeFileSync(CREDENTIALS_FILE, markdownContent);
    console.log(`\n✅ Credentials file created at: ${CREDENTIALS_FILE}`);

    await queryRunner.commitTransaction();
    console.log('--- Seed Completed Successfully ---');

  } catch (err) {
    console.error('Seed failed:', err);
    await queryRunner.rollbackTransaction();
  } finally {
    await queryRunner.release();
    await app.close();
  }
}

bootstrap();
