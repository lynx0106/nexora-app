
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { OrdersService } from '../src/orders/orders.service';
import { ProductsService } from '../src/products/products.service';
import { Product } from '../src/products/entities/product.entity';
import { DashboardService } from '../src/dashboard/dashboard.service';
import { DataSource } from 'typeorm';
import { Tenant } from '../src/tenants/entities/tenant.entity';

async function bootstrap() {
  console.log('🚀 Starting Dashboard & Stock Verification Simulation...');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  
  const ordersService = app.get(OrdersService);
  const productsService = app.get(ProductsService);
  const dashboardService = app.get(DashboardService);
  const dataSource = app.get(DataSource);

  // 1. Setup Context (Tenant & Product)
  const tenantId = 'demo-store'; // Ensure this exists or use a common one
  // We'll try to find a tenant or use a default
  let tenant = await dataSource.manager.findOne(Tenant, { where: { id: tenantId } });
  if (!tenant) {
      console.log(`ℹ️ Tenant '${tenantId}' not found, using first available.`);
      const tenants = await dataSource.manager.find(Tenant, { take: 1 });
      tenant = tenants[0];
      if (!tenant) throw new Error('No tenants found in DB. Run seeds first.');
  }
  console.log(`🏢 Using Tenant: ${tenant.name} (${tenant.id})`);

  // Find a product with stock
  const products = await productsService.findAllByTenant(tenant.id);
  const product = products.find(p => p.stock > 0);

  if (!product) {
      throw new Error('❌ No products with stock found to test deduction.');
  }

  console.log(`📦 Selected Product: ${product.name} (ID: ${product.id})`);
  console.log(`📊 Initial Stock: ${product.stock}`);

  // 2. Get Initial Dashboard Stats
  const initialChart = await dashboardService.getSalesChart(tenant.id);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayStatsInitial = initialChart.find(d => d.date === todayStr)?.total || 0;
  
  console.log(`📈 Initial Sales Today: $${todayStatsInitial}`);

  // 3. Simulate Order Creation
  const orderQuantity = 1;
  const orderTotal = Number(product.price) * orderQuantity;
  
  console.log(`\n🛒 Creating Order for 1x ${product.name} ($${product.price})...`);

  const orderData = {
      tenantId: tenant.id,
      items: [{ productId: product.id, quantity: orderQuantity, price: Number(product.price) }],
      total: orderTotal,
      customerEmail: 'test-dashboard@example.com',
      shippingAddress: { firstName: 'Test', lastName: 'Dashboard', address: '123 Test St' }
  };

  let createdOrder;
  try {
      createdOrder = await ordersService.create(orderData);
      console.log(`✅ Order Created: #${createdOrder.id}`);
  } catch (error) {
      console.error('❌ Order Creation Failed:', error);
      process.exit(1);
  }

  // 4. Verify Stock Deduction
  // We need to fetch fresh product data
  const updatedProduct = await dataSource.manager.findOne(Product, { where: { id: product.id } });
  
  if (!updatedProduct) {
      console.error('❌ Product disappeared from DB!');
      process.exit(1);
  }

  console.log(`\n--- Stock Verification ---`);
  console.log(`Previous Stock: ${product.stock}`);
  console.log(`Expected Stock: ${product.stock - orderQuantity}`);
  console.log(`Actual Stock:   ${updatedProduct.stock}`);

  if (updatedProduct.stock === product.stock - orderQuantity) {
      console.log('✅ Stock Deduction Verified!');
  } else {
      console.error('❌ Stock Deduction FAILED!');
  }

  // 5. Verify Dashboard Updates
  // Wait a moment for any async triggers if necessary (though getDailySales queries DB directly)
  console.log(`\n--- Dashboard Verification ---`);
  
  const updatedChart = await dashboardService.getSalesChart(tenant.id);
  const todayStatsUpdated = updatedChart.find(d => d.date === todayStr)?.total || 0;

  console.log(`Previous Sales Today: $${todayStatsInitial}`);
  console.log(`Expected Sales Today: $${Number(todayStatsInitial) + orderTotal}`);
  console.log(`Actual Sales Today:   $${todayStatsUpdated}`);

  // Allow for small floating point differences
  if (Math.abs(todayStatsUpdated - (Number(todayStatsInitial) + orderTotal)) < 0.01) {
      console.log('✅ Dashboard Sales Chart Updated Successfully!');
  } else {
      console.error('❌ Dashboard Update FAILED!');
  }

  // 6. Verify "Recent Activity"
  const recentActivity = await dashboardService.getRecentActivity(tenant.id);
  const foundInActivity = recentActivity.find(a => a.id === createdOrder.id);
  
  if (foundInActivity) {
      console.log(`✅ Order found in Recent Activity feed.`);
  } else {
      console.error(`❌ Order NOT found in Recent Activity feed.`);
  }

  console.log('\n✨ Simulation Complete.');
  await app.close();
}

bootstrap();
