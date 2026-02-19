import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PublicService } from './public.service';

describe('PublicService', () => {
  const tenantsService = { findOne: jest.fn() };
  const productsService = { findAllByTenant: jest.fn() };
  const appointmentsService = { findByDateRange: jest.fn(), create: jest.fn() };
  const usersService = { findByEmail: jest.fn(), createUserForTenant: jest.fn() };
  const ordersService = { create: jest.fn(), findOne: jest.fn() };

  let service: PublicService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PublicService(
      tenantsService as any,
      productsService as any,
      appointmentsService as any,
      usersService as any,
      ordersService as any,
    );
  });

  describe('getTenantInfo', () => {
    it('should return tenant public info', async () => {
      tenantsService.findOne.mockResolvedValue({
        id: 'tenant-1',
        name: 'Test Business',
        sector: 'Restaurant',
        city: 'Bogota',
        address: '123 Test St',
        logoUrl: 'https://logo.url',
        coverUrl: 'https://cover.url',
        openingTime: '09:00',
        closingTime: '18:00',
        appointmentDuration: 60,
        currency: 'COP',
      });

      const result = await service.getTenantInfo('tenant-1');

      expect(result.name).toBe('Test Business');
      expect(result.sector).toBe('Restaurant');
      expect(result).not.toHaveProperty('openaiApiKey');
    });

    it('should throw NotFoundException if tenant not found', async () => {
      tenantsService.findOne.mockResolvedValue(null);

      await expect(service.getTenantInfo('nonexistent')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('getTenantServices', () => {
    it('should return only products with duration (services)', async () => {
      productsService.findAllByTenant.mockResolvedValue([
        { id: '1', name: 'Service 1', duration: 60 },
        { id: '2', name: 'Product 1', duration: null },
        { id: '3', name: 'Service 2', duration: 30 },
      ]);

      const result = await service.getTenantServices('tenant-1');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Service 1');
      expect(result[1].name).toBe('Service 2');
    });
  });

  describe('getTenantProducts', () => {
    it('should return only products without duration', async () => {
      productsService.findAllByTenant.mockResolvedValue([
        { id: '1', name: 'Service 1', duration: 60 },
        { id: '2', name: 'Product 1', duration: null },
        { id: '3', name: 'Product 2', duration: 0 },
      ]);

      const result = await service.getTenantProducts('tenant-1');

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Product 1');
      expect(result[1].name).toBe('Product 2');
    });
  });

  describe('getAvailability', () => {
    it('should return available slots', async () => {
      tenantsService.findOne.mockResolvedValue({
        id: 'tenant-1',
        openingTime: '09:00',
        closingTime: '12:00',
        appointmentDuration: 60,
      });
      appointmentsService.findByDateRange.mockResolvedValue([]);

      const result = await service.getAvailability('tenant-1', '2026-02-20');

      expect(result.length).toBeGreaterThan(0);
      // Result is an array of Date objects or strings
      expect(result[0]).toBeDefined();
    });

    it('should throw BadRequestException for invalid date', async () => {
      tenantsService.findOne.mockResolvedValue({
        id: 'tenant-1',
        openingTime: '09:00',
        closingTime: '18:00',
        appointmentDuration: 60,
      });

      await expect(service.getAvailability('tenant-1', 'invalid')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if tenant not found', async () => {
      tenantsService.findOne.mockResolvedValue(null);

      await expect(service.getAvailability('tenant-1', '2026-02-20')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('getOrderStatus', () => {
    it('bloquea cuando falta token en consulta publica de pedido', async () => {
      await expect(service.getOrderStatus('order-1', '')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('bloquea token expirado', async () => {
      ordersService.findOne.mockResolvedValue({
        id: 'order-2',
        publicTokenHash: 'hash',
        publicTokenExpiresAt: new Date(Date.now() - 1000),
        items: [],
        tenant: { currency: 'USD', name: 'Demo', logoUrl: '', phone: '' },
      });

      await expect(service.getOrderStatus('order-2', 'token')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('rechaza token invalido', async () => {
      const token = 'valid';
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      ordersService.findOne.mockResolvedValue({
        id: 'order-3',
        publicTokenHash: tokenHash,
        publicTokenExpiresAt: new Date(Date.now() + 1000),
        items: [],
        tenant: { currency: 'USD', name: 'Demo', logoUrl: '', phone: '' },
      });

      await expect(service.getOrderStatus('order-3', 'other')).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('retorna estado si token es valido', async () => {
      const token = 'valid-token';
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      ordersService.findOne.mockResolvedValue({
        id: 'order-4',
        createdAt: new Date('2026-02-15T00:00:00Z'),
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: 'card',
        total: 100,
        publicTokenHash: tokenHash,
        publicTokenExpiresAt: new Date(Date.now() + 1000),
        items: [
          {
            quantity: 1,
            price: 100,
            product: { name: 'Demo', imageUrl: 'x' },
          },
        ],
        shippingAddress: { city: 'Bogota' },
        customerEmail: 'demo@test.com',
        paymentLink: 'https://pay',
        tenant: { currency: 'USD', name: 'Demo', logoUrl: '', phone: '' },
      });

      const result = await service.getOrderStatus('order-4', token);
      expect(result.id).toBe('order-4');
      expect(result.paymentLink).toBe('https://pay');
    });
  });

  describe('createAppointment', () => {
    it('bloquea honeypot en reservas', async () => {
      await expect(
        service.createAppointment('tenant-1', {
          serviceId: 'svc-1',
          dateTime: new Date().toISOString(),
          client: { firstName: 'Ana', lastName: 'Perez', email: 'a@test.com' },
          website: 'bot',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('exige captcha si hay secreto configurado', async () => {
      const previous = process.env.CAPTCHA_SECRET;
      process.env.CAPTCHA_SECRET = 'secret';

      await expect(
        service.createAppointment('tenant-1', {
          serviceId: 'svc-1',
          dateTime: new Date().toISOString(),
          client: { firstName: 'Ana', lastName: 'Perez', email: 'a@test.com' },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      process.env.CAPTCHA_SECRET = previous;
    });

    it('should create appointment with valid data', async () => {
      const previous = process.env.CAPTCHA_SECRET;
      delete process.env.CAPTCHA_SECRET;

      tenantsService.findOne.mockResolvedValue({ id: 'tenant-1' });
      productsService.findAllByTenant.mockResolvedValue([
        { id: 'svc-1', name: 'Test Service', price: 100, duration: 60 },
      ]);
      usersService.findByEmail.mockResolvedValue(null);
      usersService.createUserForTenant.mockResolvedValue({ id: 'user-1' });
      appointmentsService.create.mockResolvedValue({ id: 'apt-1' });

      const result = await service.createAppointment('tenant-1', {
        serviceId: 'svc-1',
        dateTime: '2026-02-20T10:00:00',
        client: { firstName: 'Ana', lastName: 'Perez', email: 'a@test.com' },
      });

      expect(result).toBeDefined();
      expect(appointmentsService.create).toHaveBeenCalled();

      process.env.CAPTCHA_SECRET = previous;
    });
  });

  describe('createOrder', () => {
    it('should block honeypot in orders', async () => {
      await expect(
        service.createOrder('tenant-1', {
          items: [{ productId: 'prod-1', quantity: 1 }],
          customer: { firstName: 'Test', email: 'test@test.com' },
          website: 'bot',
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should require captcha when configured', async () => {
      const previous = process.env.CAPTCHA_SECRET;
      process.env.CAPTCHA_SECRET = 'secret';

      await expect(
        service.createOrder('tenant-1', {
          items: [{ productId: 'prod-1', quantity: 1 }],
          customerEmail: 'test@test.com',
        } as any),
      ).rejects.toBeInstanceOf(BadRequestException);

      process.env.CAPTCHA_SECRET = previous;
    });
  });
});
