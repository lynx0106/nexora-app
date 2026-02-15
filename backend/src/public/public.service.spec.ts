import { BadRequestException, ForbiddenException } from '@nestjs/common';
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
});
