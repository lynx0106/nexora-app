
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { ProductsService } from '../src/products/products.service';
import { UsersService } from '../src/users/users.service';
import { OrdersService } from '../src/orders/orders.service';
import { User } from '../src/users/entities/user.entity';
import { DataSource } from 'typeorm';

async function debugFrontendSimulation() {
  console.log('🔍 Starting Frontend Simulation Debug...');

  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);
  const productsService = app.get(ProductsService);
  const usersService = app.get(UsersService);
  const ordersService = app.get(OrdersService);

  try {
    // 1. Login
    console.log('\n--- 1. Authentication ---');
    const email = 'admin@restaurant.com';
    const password = 'password123';
    const loginResult = await authService.validateUser(email, password);
    
    if (!loginResult) {
        throw new Error('Login failed');
    }
    console.log('✅ Login successful:', loginResult.email);
    const tenantId = loginResult.tenantId;
    console.log('ℹ️ Tenant ID:', tenantId);

    // 2. Fetch Products (Simulating CreateOrderModal)
    console.log('\n--- 2. Fetching Products ---');
    const products = await productsService.findAllByTenant(tenantId);
    console.log(`ℹ️ Found ${products.length} products`);
    
    if (products.length > 0) {
        console.log('Sample Product:', JSON.stringify(products[0], null, 2));
        
        // Check for anomalies
        const invalidProducts = products.filter(p => !p.id || p.stock === undefined || p.price === undefined);
        if (invalidProducts.length > 0) {
            console.error('❌ Found invalid products:', invalidProducts);
        } else {
            console.log('✅ All products seem valid structure-wise.');
        }
    } else {
        console.warn('⚠️ No products found. Modal will show empty selector.');
    }

    // 3. Fetch Clients (Simulating CreateOrderModal)
    console.log('\n--- 3. Fetching Clients ---');
    const dataSource = app.get(DataSource);
    const userRepo = dataSource.getRepository(User);
    const clients = await userRepo.find({ where: { tenantId, role: 'user' } });
    
    console.log(`ℹ️ Found ${clients.length} clients`);
    if (clients.length > 0) {
        console.log('Sample Client:', JSON.stringify(clients[0], null, 2));
    }

    // 4. Check Top Products (Simulating OrdersSection crash)
    console.log('\n--- 4. Checking Top Products (OrdersSection) ---');
    const topProducts = await ordersService.getTopProducts(tenantId);
    console.log(`ℹ️ Found ${topProducts.length} top products`);
    console.log('Top Products Data:', JSON.stringify(topProducts, null, 2));
    
    // Check for nulls that causes crash
    const badTopProducts = topProducts.filter(p => !p.id || !p.name);
    if (badTopProducts.length > 0) {
        console.error('❌ Found MALFORMED top products (potential crash cause):', badTopProducts);
    } else {
        console.log('✅ Top products look safe.');
    }

    // 5. Simulate Order Creation Payload
    console.log('\n--- 5. Simulating Order Creation Payload ---');
    if (products.length === 0) {
        console.log('⚠️ Cannot create order: No products.');
    } else {
        const product = products[0];
        const payload = {
            tenantId,
            userId: clients.length > 0 ? clients[0].id : undefined,
            customerName: clients.length > 0 ? `${clients[0].firstName} ${clients[0].lastName}` : 'Cliente Ocasional',
            customerEmail: clients.length > 0 ? clients[0].email : undefined,
            items: [
                {
                    productId: product.id,
                    quantity: 1,
                    price: Number(product.price)
                }
            ],
            paymentMethod: 'cash',
            paymentStatus: 'pending',
            shippingAddress: { street: 'Calle 123', city: 'Bogota' }
        };

        console.log('Constructed Payload:', JSON.stringify(payload, null, 2));

        try {
            const order = await ordersService.create(payload);
            console.log('✅ Order created successfully:', order.id);
        } catch (err) {
            console.error('❌ Order creation failed:', err.message);
            console.error(err);
        }
    }

  } catch (error) {
    console.error('❌ Debug script error:', error);
  } finally {
    await app.close();
  }
}

debugFrontendSimulation();
