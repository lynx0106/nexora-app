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

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('Seeding data...');

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // 1. Clean up old tenants (except preserved ones)
    const preservedTenants = ['clinica-dental-vital', 'belleza-plus', 'system'];

    console.log('Cleaning up old tenants...');

    // Delete OrderItems and Orders first
    await queryRunner.manager
      .createQueryBuilder()
      .delete()
      .from(OrderItem)
      .where(
        'orderId IN (SELECT id FROM "orders" WHERE "tenantId" NOT IN (:...tenants))',
        { tenants: preservedTenants },
      )
      .execute();

    await queryRunner.manager
      .createQueryBuilder()
      .delete()
      .from(Order)
      .where('"tenantId" NOT IN (:...tenants)', { tenants: preservedTenants })
      .execute();

    // Delete Appointments
    await queryRunner.manager
      .createQueryBuilder()
      .delete()
      .from(Appointment)
      .where(
        '"tenantId" NOT IN (:...tenants) OR "doctorId" IN (SELECT id FROM "users" WHERE "tenantId" NOT IN (:...tenants)) OR "clientId" IN (SELECT id FROM "users" WHERE "tenantId" NOT IN (:...tenants))',
        { tenants: preservedTenants },
      )
      .execute();

    // Delete Products
    await queryRunner.manager
      .createQueryBuilder()
      .delete()
      .from(Product)
      .where('"tenantId" NOT IN (:...tenants)', { tenants: preservedTenants })
      .execute();

    // Delete Users
    await queryRunner.manager
      .createQueryBuilder()
      .delete()
      .from(User)
      .where('"tenantId" NOT IN (:...tenants)', { tenants: preservedTenants })
      .execute();

    // Delete Tenants (Finally)
    await queryRunner.manager
      .createQueryBuilder()
      .delete()
      .from(Tenant)
      .where('id NOT IN (:...tenants)', { tenants: preservedTenants })
      .execute();

    // 2. Create New Tenants Data
    const passwordHash = await bcrypt.hash('Admin123!', 10);

    const newTenants = [
      {
        id: 'abastos-la-frescura',
        name: 'Abastos La Frescura',
        sector: 'retail',
        admin: {
          firstName: 'Juan',
          lastName: 'Tendero',
          email: 'admin@abastos.com',
        },
        products: [
          {
            name: '🥦 Canasta de Verduras',
            price: 15,
            description: 'Selección de verduras frescas de temporada.',
            duration: null,
          },
          {
            name: '🥛 Leche Entera (Litro)',
            price: 1.5,
            description: 'Leche fresca de granja.',
            duration: null,
          },
          {
            name: '🥖 Pan Artesanal',
            price: 2,
            description: 'Pan horneado diariamente.',
            duration: null,
          },
          {
            name: '🍚 Arroz Premium (kg)',
            price: 3,
            description: 'Arroz de grano largo seleccionado.',
            duration: null,
          },
          {
            name: '🥚 Cartón de Huevos',
            price: 5,
            description: 'Huevos orgánicos de gallinas felices.',
            duration: null,
          },
        ],
      },
      {
        id: 'pet-friends',
        name: 'Pet Friends',
        sector: 'mascotas',
        admin: {
          firstName: 'Ana',
          lastName: 'Veterinaria',
          email: 'admin@petfriends.com',
        },
        products: [
          {
            name: '🦴 Hueso de Juguete',
            price: 8,
            description: 'Juguete resistente para perros.',
            duration: null,
          },
          {
            name: '🐱 Arena para Gatos',
            price: 12,
            description: 'Arena aglomerante de alta calidad.',
            duration: null,
          },
          {
            name: '🚿 Baño y Corte (Perro Pequeño)',
            price: 25,
            description: 'Servicio completo de peluquería canina.',
            duration: 60,
          },
          {
            name: '🏥 Consulta Veterinaria',
            price: 30,
            description: 'Revisión general de salud.',
            duration: 30,
          },
          {
            name: '🐕 Paseo de 1 hora',
            price: 15,
            description: 'Paseo individualizado por el parque.',
            duration: 60,
          },
        ],
      },
      {
        id: 'moda-urbana',
        name: 'Moda Urbana',
        sector: 'retail',
        admin: {
          firstName: 'Sofia',
          lastName: 'Estilista',
          email: 'admin@modaurbana.com',
        },
        products: [
          {
            name: '👕 Camiseta Básica',
            price: 15,
            description: 'Algodón 100% orgánico.',
            duration: null,
          },
          {
            name: '👖 Jeans Slim Fit',
            price: 45,
            description: 'Denim elástico de alta durabilidad.',
            duration: null,
          },
          {
            name: '👟 Zapatillas Casual',
            price: 60,
            description: 'Diseño moderno y cómodo.',
            duration: null,
          },
          {
            name: '🧥 Chaqueta de Cuero',
            price: 120,
            description: 'Cuero sintético de primera calidad.',
            duration: null,
          },
        ],
      },
      {
        id: 'tech-master',
        name: 'Tech Master',
        sector: 'tecnologia',
        admin: {
          firstName: 'David',
          lastName: 'Tech',
          email: 'admin@techmaster.com',
        },
        products: [
          // Productos físicos
          {
            name: '💻 Laptop Gamer',
            price: 1200,
            description: 'Procesador i7, 16GB RAM, RTX 3060.',
            duration: null,
          },
          {
            name: '🖱️ Mouse Inalámbrico',
            price: 25,
            description: 'Ergonómico con batería de larga duración.',
            duration: null,
          },
          {
            name: '🎧 Auriculares Noise Cancelling',
            price: 150,
            description: 'Sonido de alta fidelidad con cancelación de ruido.',
            duration: null,
          },
          // Servicios (Agenda)
          {
            name: '🔧 Mantenimiento Preventivo',
            price: 40,
            description: 'Limpieza interna y cambio de pasta térmica.',
            duration: 60,
          },
          {
            name: '🦠 Eliminación de Virus',
            price: 30,
            description: 'Limpieza completa de malware y optimización.',
            duration: 45,
          },
          {
            name: '🖥️ Armado de PC',
            price: 80,
            description:
              'Montaje profesional de componentes y gestión de cables.',
            duration: 120,
          },
          {
            name: '🆘 Soporte Remoto',
            price: 50,
            description: 'Resolución de problemas de software a distancia.',
            duration: 30,
          },
        ],
      },
    ];

    console.log('Creating new tenants...');

    for (const tenantData of newTenants) {
      console.log(`Processing ${tenantData.name}...`);

      // Create Tenant
      const tenant = queryRunner.manager.create(Tenant, {
        id: tenantData.id,
        name: tenantData.name,
        sector: tenantData.sector,
        country: 'Colombia', // Default for seed
        currency: 'COP',
        openingTime: '09:00',
        closingTime: '18:00',
      });
      await queryRunner.manager.save(tenant);

      // Create Admin User
      const adminUser = queryRunner.manager.create(User, {
        firstName: tenantData.admin.firstName,
        lastName: tenantData.admin.lastName,
        email: tenantData.admin.email,
        passwordHash: passwordHash,
        role: 'admin',
        tenantId: tenantData.id,
        isActive: true,
      });
      await queryRunner.manager.save(adminUser);

      // Create Products
      for (const prod of tenantData.products) {
        const product = queryRunner.manager.create(Product, {
          name: prod.name,
          description: prod.description,
          price: prod.price,
          tenantId: tenantData.id,
          isActive: true,
          // Random placeholder image based on sector keyword or just generic
          imageUrl: `https://placehold.co/600x400/22c55e/ffffff?text=${encodeURIComponent(prod.name.split(' ')[1] || 'Product')}`,
        });
        await queryRunner.manager.save(product);
      }
    }

    await queryRunner.commitTransaction();
    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Seeding failed:', err);
    await queryRunner.rollbackTransaction();
  } finally {
    await queryRunner.release();
    await app.close();
  }
}

bootstrap();
