import { ReportsService } from './reports.service';
import { BadRequestException } from '@nestjs/common';

describe('ReportsService', () => {
  const ordersService = { findForReport: jest.fn() };
  const appointmentsService = { findForReport: jest.fn() };
  const usersService = { findForReport: jest.fn() };

  let service: ReportsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReportsService(
      ordersService as any,
      appointmentsService as any,
      usersService as any,
    );
  });

  it('rechaza rango invalido', async () => {
    await expect(
      service.getOrdersReport('tenant-1', '2026-02-10', '2026-02-01'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('retorna csv vacio si no hay filas', async () => {
    const res: any = {
      setHeader: jest.fn(),
    };
    const output = service.respondWithFormat(res, [], 'csv', 'orders-tenant');
    expect(output).toBe('');
  });

  it('retorna json cuando se solicita', async () => {
    const res: any = {
      setHeader: jest.fn(),
    };
    const output = service.respondWithFormat(res, [{ id: '1' }], 'json', 'orders-tenant');
    expect(output).toEqual({ count: 1, data: [{ id: '1' }] });
  });
});
