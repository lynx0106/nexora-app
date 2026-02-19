import { Test, TestingModule } from '@nestjs/testing';
import { PaymentsService } from './payments.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Order } from '../orders/entities/order.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { MailService } from '../mail/mail.service';
import { InternalServerErrorException } from '@nestjs/common';

// Mock MercadoPago
jest.mock('mercadopago', () => ({
  MercadoPagoConfig: jest.fn().mockImplementation(() => ({
    accessToken: 'test-token',
  })),
  Preference: jest.fn().mockImplementation(() => ({
    create: jest.fn().mockResolvedValue({
      id: 'preference-123',
      init_point: 'https://mercadopago.com/pay/123',
      sandbox_init_point: 'https://sandbox.mercadopago.com/pay/123',
    }),
  })),
  Payment: jest.fn().mockImplementation(() => ({
    get: jest.fn().mockResolvedValue({
      id: 123456789,
      status: 'approved',
      external_reference: 'order-123',
      status_detail: 'accredited',
      payment_method_id: 'visa',
      transaction_amount: 100,
    }),
  })),
}));

describe('PaymentsService', () => {
  let service: PaymentsService;
  let orderRepo: jest.Mocked<any>;
  let tenantRepo: jest.Mocked<any>;
  let mailService: jest.Mocked<MailService>;

  const mockOrder = {
    id: 'order-123',
    tenantId: 'tenant-123',
    total: 100,
    customerEmail: 'customer@test.com',
    items: [
      {
        productId: 'product-123',
        quantity: 2,
        price: 50,
        product: { name: 'Test Product' },
      },
    ],
    tenant: {
      id: 'tenant-123',
      name: 'Test Tenant',
      currency: 'COP',
    },
  };

  const mockTenant = {
    id: 'tenant-123',
    name: 'Test Tenant',
    currency: 'COP',
    mercadoPagoAccessToken: 'test-mp-token',
  };

  beforeEach(async () => {
    const mockOrderRepo = {
      findOne: jest.fn().mockResolvedValue(mockOrder),
      save: jest.fn().mockResolvedValue(mockOrder),
    };

    const mockTenantRepo = {
      findOne: jest.fn().mockResolvedValue(mockTenant),
    };

    const mockMailService = {
      sendMail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getRepositoryToken(Order), useValue: mockOrderRepo },
        { provide: getRepositoryToken(Tenant), useValue: mockTenantRepo },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
    orderRepo = module.get(getRepositoryToken(Order));
    tenantRepo = module.get(getRepositoryToken(Tenant));
    mailService = module.get(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createPreference', () => {
    it('should create a payment preference successfully', async () => {
      const result = await service.createPreference(mockOrder as any, mockTenant as any);

      expect(result).toBeDefined();
      expect(result.preferenceId).toBe('preference-123');
      expect(result.initPoint).toContain('mercadopago.com');
    });

    it('should throw InternalServerErrorException if no access token', async () => {
      const tenantWithoutToken = { ...mockTenant, mercadoPagoAccessToken: null };
      delete process.env.MP_ACCESS_TOKEN;

      await expect(
        service.createPreference(mockOrder as any, tenantWithoutToken as any),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('processPaymentNotificationWithRetry', () => {
    it('should process payment notification successfully', async () => {
      orderRepo.findOne.mockResolvedValue({
        ...mockOrder,
        paymentStatus: 'pending',
        status: 'pending',
      });

      await service.processPaymentNotificationWithRetry('123456789', 'tenant-123');

      // Verify order was updated
      expect(orderRepo.save).toHaveBeenCalled();
    });

    it('should handle simulated payment', async () => {
      orderRepo.findOne.mockResolvedValue({
        ...mockOrder,
        paymentStatus: 'pending',
        status: 'pending',
      });

      await service.processPaymentNotificationWithRetry(
        'sim_order-123_approved',
        'tenant-123',
      );

      expect(orderRepo.save).toHaveBeenCalled();
    });

    it('should handle payment not found', async () => {
      orderRepo.findOne.mockResolvedValue(null);

      await expect(
        service.processPaymentNotificationWithRetry('sim_nonexistent_approved', 'tenant-123'),
      ).resolves.not.toThrow();
    });
  });

  describe('getFrontendUrl', () => {
    it('should return default frontend URL if not configured', () => {
      delete process.env.FRONTEND_URL;
      const url = service['getFrontendUrl']();
      expect(url).toBe('http://localhost:3002');
    });

    it('should return configured frontend URL', () => {
      process.env.FRONTEND_URL = 'https://myapp.com/';
      const url = service['getFrontendUrl']();
      expect(url).toBe('https://myapp.com');
    });
  });

  describe('getBackendUrl', () => {
    it('should return default backend URL if not configured', () => {
      delete process.env.BACKEND_URL;
      const url = service['getBackendUrl']();
      expect(url).toBe('http://localhost:4001');
    });

    it('should return configured backend URL', () => {
      process.env.BACKEND_URL = 'https://api.myapp.com/';
      const url = service['getBackendUrl']();
      expect(url).toBe('https://api.myapp.com');
    });
  });
});
