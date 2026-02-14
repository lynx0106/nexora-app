import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { Tenant } from '../src/tenants/entities/tenant.entity';
import { Product } from '../src/products/entities/product.entity';
import { PublicService } from '../src/public/public.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);
  const publicService = app.get(PublicService);

  const tenantRepo = dataSource.getRepository(Tenant);
  const productRepo = dataSource.getRepository(Product);

  const tenant = await tenantRepo.findOne({ where: {} });
  if (!tenant) {
    console.log('No tenants found.');
    process.exit(1);
  }

  const product = await productRepo.findOne({ where: { tenantId: tenant.id } });
  let productToUse = product;

  if (!productToUse) {
    console.log('Creating dummy product...');
    const newProduct = productRepo.create({
        tenantId: tenant.id,
        name: 'Test Product',
        description: 'Test Description',
        price: 100,
        stock: 100, // Sufficient stock
        imageUrl: 'https://via.placeholder.com/150',
    });
    productToUse = await productRepo.save(newProduct);
  } else {
    // Ensure stock
    productToUse.stock = 100;
    await productRepo.save(productToUse);
  }
  
  if (!productToUse) {
      console.log('Failed to get product');
      process.exit(1);
  }

  console.log(`Using Tenant: ${tenant.id} (${tenant.name})`);
  console.log(`Using Product: ${productToUse.id} (${productToUse.name})`);

  try {
    console.log('Sending Test Order...');
    const result = await publicService.createOrder(tenant.id, {
        items: [{ productId: productToUse.id, quantity: 1, price: Number(productToUse.price) }],
        client: {
            firstName: 'Lynxia',
            lastName: 'Test',
            email: 'lincecarlos01@gmail.com', // Changed to registered Resend email for testing
            address: 'Calle Falsa 123',
            city: 'Bogota'
        }
    });
    console.log('Order created successfully:', result.id);
  } catch (error) {
    console.error('Error creating order:', error);
  }

  await app.close();
}

bootstrap();
