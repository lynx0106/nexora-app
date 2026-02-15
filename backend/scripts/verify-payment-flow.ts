
import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from '../src/orders/orders.service';
import { PaymentsService } from '../src/payments/payments.service';
import { MailService } from '../src/mail/mail.service';
import { TenantsService } from '../src/tenants/tenants.service';
import { ProductsService } from '../src/products/products.service';
import { ChatGateway } from '../src/chat/chat.gateway';
import { ChatService } from '../src/chat/chat.service';
import { UsersService } from '../src/users/users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from '../src/orders/entities/order.entity';
import { Product } from '../src/products/entities/product.entity';
import { Tenant } from '../src/tenants/entities/tenant.entity';
import { DataSource } from 'typeorm';
import { Payment, Preference } from 'mercadopago';

// MANUAL MOCK via Prototype Patching for MercadoPago
console.log('Patching MercadoPago prototypes...');

// @ts-ignore
Preference.prototype.create = async function(data) {
  console.log('Mock MercadoPago Preference.create called with:', JSON.stringify(data, null, 2));
  return {
    id: 'pref_123456',
    init_point: 'https://www.mercadopago.com.co/checkout/v1/redirect?pref_id=123456',
    sandbox_init_point: 'https://sandbox.mercadopago.com.co/checkout/v1/redirect?pref_id=123456'
  };
};

// @ts-ignore
Payment.prototype.get = async function(opts) {
  console.log('Mock MercadoPago Payment.get called with:', opts);
  return {
    id: 123456789,
    status: 'approved',
    status_detail: 'accredited',
    external_reference: 'order_123',
    transaction_amount: 10000,
    payment_method_id: 'visa',
    payer: {
      email: 'customer@example.com'
    }
  };
};

async function bootstrap() {
  console.log('Starting Payment Flow Verification...');

  // Stateful Mocks
  const ordersDb = new Map<string, any>();
  const productsDb = new Map<string, any>();
  productsDb.set('prod_1', { id: 'prod_1', name: 'Test Product', price: 10000, stock: 100 });
  
  const tenantData = { 
    id: 'tenant_123', 
    name: 'Test Tenant',
    accessToken: 'TEST_ACCESS_TOKEN',
    publicKey: 'TEST_PUBLIC_KEY',
    currency: 'COP',
    mercadoPagoAccessToken: 'TEST_MP_TOKEN'
  };

  const mockQueryRunner = {
    connect: async () => {},
    startTransaction: async () => {},
    commitTransaction: async () => {},
    rollbackTransaction: async () => {},
    release: async () => {},
    manager: {
      save: async (entity, data) => {
        // If entity is passed as first arg, data is second. If only data, it's first.
        // TypeORM save(Entity, entityLike) or save(entityLike)
        const entityData = data || entity; 
        const id = entityData.id || 'order_123';
        const saved = { ...entityData, id, createdAt: new Date() };
        
        if (entity === Order || entityData.items) { // Rough check for Order
             ordersDb.set(id, saved);
        } else if (entity === Product || entityData.stock !== undefined) {
             productsDb.set(id, saved);
        }
        return saved;
      },
      findOne: async (entity, options) => {
        if (entity === Product) {
            return productsDb.get(options.where.id);
        }
        if (entity === Tenant) {
            return tenantData;
        }
        return null;
      }
    }
  };

  const mockDataSource = {
    createQueryRunner: () => mockQueryRunner,
    manager: mockQueryRunner.manager
  };

  const mockOrdersRepo = {
    create: (data) => data,
    save: async (data) => {
        const id = data.id || 'order_123';
        const saved = { ...data, id };
        ordersDb.set(id, saved);
        return saved;
    },
    findOne: async (options) => {
        const id = options.where.id;
        const order = ordersDb.get(id);
        if (order && options.relations && options.relations.includes('tenant')) {
            return { ...order, tenant: tenantData };
        }
        return order;
    }
  };

  const mockProductsRepo = {
    create: (data) => data,
    save: async (data) => {
        productsDb.set(data.id, data);
        return data;
    },
    findOne: async (opts) => productsDb.get(opts.where.id),
    update: async () => {}
  };

  const mockTenantsRepo = {
    findOne: async () => tenantData,
    save: async (data) => data
  };

  const mockMailService = {
    sendOrderConfirmation: async (order, tenant) => {
      console.log('📧 Mock Email Sent: Order Confirmation for', order.id);
    },
    sendMail: async (options) => {
        console.log('📧 Mock Generic Email Sent:', options.subject);
    }
  };

  const mockChatGateway = {
    server: {
      to: (room) => ({
        emit: (event, data) => console.log(`💬 Mock Chat Event [${room}]: ${event}`, data)
      })
    },
    handleMessage: async () => {} 
  };
  
  const mockChatService = {
      getMessages: async () => []
  };

  const moduleRef: TestingModule = await Test.createTestingModule({
    providers: [
      OrdersService,
      PaymentsService,
      ProductsService,
      TenantsService,
      { provide: DataSource, useValue: mockDataSource },
      { provide: getRepositoryToken(Order), useValue: mockOrdersRepo },
      { provide: getRepositoryToken(Product), useValue: mockProductsRepo },
      { provide: getRepositoryToken(Tenant), useValue: mockTenantsRepo },
      { provide: MailService, useValue: mockMailService },
      { provide: ChatGateway, useValue: mockChatGateway },
      { provide: ChatService, useValue: mockChatService },
      { provide: UsersService, useValue: {} } 
    ],
  }).compile();

  const ordersService = moduleRef.get<OrdersService>(OrdersService);
  const paymentsService = moduleRef.get<PaymentsService>(PaymentsService);

  // 1. Create Order and Verify Payment Link Generation
  console.log('\n--- Step 1: Creating Order ---');
  try {
    const orderData = {
      tenantId: 'tenant_123',
      items: [
        { productId: 'prod_1', quantity: 1, price: 10000 }
      ],
      shippingAddress: {
        firstName: 'Juan',
        lastName: 'Perez',
        street: 'Calle 123',
        city: 'Bogota',
        country: 'Colombia'
      },
      customerEmail: 'juan@example.com',
      paymentMethod: 'card', 
      paymentStatus: 'pending'
    };

    const createdOrder = await ordersService.create(orderData);
    console.log('✅ Order Created:', createdOrder.id);
    
    // Store in our mock DB just in case create() didn't use the repo save() exactly how we expect
    // (though create() calls save() which we mocked to update ordersDb)
    
    if (createdOrder.paymentLink && createdOrder.preferenceId) {
        console.log('✅ Payment Link Generated:', createdOrder.paymentLink);
        console.log('✅ Preference ID:', createdOrder.preferenceId);
    } else {
        console.error('❌ Payment Link NOT Generated');
        process.exit(1);
    }

    // 2. Simulate Webhook / Payment Notification
    console.log('\n--- Step 2: Simulating Payment Webhook ---');
    const paymentId = '123456789'; 
    const tenantId = 'tenant_123';
    
    // This returns void, but updates the order in DB
    await paymentsService.processPaymentNotificationWithRetry(paymentId, tenantId);
    
    // Fetch order again to check status
    const updatedOrder = ordersDb.get(createdOrder.id);
    
    if (updatedOrder) {
        console.log('✅ Payment Processed. Order Status:', updatedOrder.status);
        console.log('✅ Payment Status:', updatedOrder.paymentStatus);
        
        if (updatedOrder.paymentStatus === 'paid') {
             console.log('✅ Flow Success: Order is PAID');
        } else {
             console.warn('⚠️ Order status is not PAID. Actual:', updatedOrder.paymentStatus);
        }
    } else {
        console.error('❌ Failed to retrieve updated order');
    }

    console.log('\n--- 3. Verifying Public Order Status Endpoint ---');
    // Simulate calling the new public endpoint logic directly (since we can't easily spin up the full HTTP server here, we'll invoke the service method or repository)
    // But wait, we can just use the ordersService.findOne that we exposed!
  
    const publicOrderView = await ordersService.findOne(createdOrder.id);
    console.log('Fetching order for Public View:', publicOrderView ? 'FOUND' : 'NOT FOUND');
  
    if (publicOrderView) {
        console.log('Public View Data:', {
            id: publicOrderView.id,
            status: publicOrderView.status,
            paymentLink: publicOrderView.paymentLink,
            customerEmail: publicOrderView.customerEmail,
            items: publicOrderView.items
        });

        if (publicOrderView.paymentLink === 'https://www.mercadopago.com.co/checkout/v1/redirect?pref_id=123456') {
            console.log('✅ Payment Link Verified in DB');
        } else {
            console.error('❌ Payment Link Mismatch or Missing');
        }
    }

    console.log('\n--- Verification Complete ---');

  } catch (error) {
    console.error('❌ Test Failed:', error);
  }
}

bootstrap().catch(err => {
  console.error('Verification Failed:', err);
  process.exit(1);
});
