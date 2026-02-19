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

  describe('getOrdersReport', () => {
    it('should return orders report with valid date range', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          createdAt: new Date('2026-02-15'),
          status: 'completed',
          paymentStatus: 'paid',
          paymentMethod: 'card',
          total: 100,
          tenant: { currency: 'USD' },
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          userId: 'user-1',
          tenantId: 'tenant-1',
        },
      ];
      ordersService.findForReport.mockResolvedValue(mockOrders);

      const result = await service.getOrdersReport('tenant-1', '2026-02-01', '2026-02-28');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('order-1');
      expect(result[0].total).toBe(100);
    });

    it('should use default date range when not provided', async () => {
      ordersService.findForReport.mockResolvedValue([]);

      await service.getOrdersReport('tenant-1', undefined, undefined);

      expect(ordersService.findForReport).toHaveBeenCalled();
    });

    it('should filter by userId when provided', async () => {
      ordersService.findForReport.mockResolvedValue([]);

      await service.getOrdersReport('tenant-1', '2026-02-01', '2026-02-28', 'user-1');

      expect(ordersService.findForReport).toHaveBeenCalledWith(
        'tenant-1',
        expect.any(Date),
        expect.any(Date),
        'user-1',
      );
    });
  });

  describe('getAppointmentsReport', () => {
    it('should return appointments report', async () => {
      const mockAppointments = [
        {
          id: 'apt-1',
          dateTime: new Date('2026-02-15T10:00:00'),
          status: 'confirmed',
          service: { name: 'Haircut' },
          doctor: { firstName: 'Dr.', lastName: 'Smith' },
          client: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
          tenantId: 'tenant-1',
        },
      ];
      appointmentsService.findForReport.mockResolvedValue(mockAppointments);

      const result = await service.getAppointmentsReport('tenant-1', '2026-02-01', '2026-02-28');

      expect(result).toHaveLength(1);
      expect(result[0].serviceName).toBe('Haircut');
      expect(result[0].doctorName).toBe('Dr. Smith');
    });

    it('should handle appointments without doctor', async () => {
      const mockAppointments = [
        {
          id: 'apt-1',
          dateTime: new Date('2026-02-15T10:00:00'),
          status: 'confirmed',
          service: { name: 'Service' },
          doctor: null,
          client: { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
          tenantId: 'tenant-1',
        },
      ];
      appointmentsService.findForReport.mockResolvedValue(mockAppointments);

      const result = await service.getAppointmentsReport('tenant-1', '2026-02-01', '2026-02-28');

      expect(result[0].doctorName).toBe('');
    });
  });

  describe('getUsersReport', () => {
    it('should return users report', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          createdAt: new Date('2026-02-15'),
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          role: 'user',
          isActive: true,
          tenantId: 'tenant-1',
        },
      ];
      usersService.findForReport.mockResolvedValue(mockUsers);

      const result = await service.getUsersReport('tenant-1', '2026-02-01', '2026-02-28');

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('john@example.com');
    });
  });

  describe('respondWithFormat', () => {
    it('should throw BadRequestException for unsupported format', () => {
      const res: any = { setHeader: jest.fn() };

      expect(() => service.respondWithFormat(res, [{ id: '1' }], 'xml', 'orders')).toThrow(
        BadRequestException,
      );
    });

    it('should generate CSV with proper headers', () => {
      const res: any = { setHeader: jest.fn() };
      const rows = [{ id: '1', name: 'Test', value: 100 }];

      const result = service.respondWithFormat(res, rows, 'csv', 'test-report');

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv; charset=utf-8');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('test-report'),
      );
      expect(result).toContain('id,name,value');
    });

    it('should escape CSV values with special characters', () => {
      const res: any = { setHeader: jest.fn() };
      const rows = [{ id: '1', name: 'Test, with "quotes"' }];

      const result = service.respondWithFormat(res, rows, 'csv', 'test');

      expect(result).toContain('"Test, with ""quotes"""');
    });

    it('should handle null and undefined values in CSV', () => {
      const res: any = { setHeader: jest.fn() };
      const rows = [{ id: '1', name: null, value: undefined }];

      const result = service.respondWithFormat(res, rows, 'csv', 'test');

      expect(result).toContain('1,,');
    });
  });

  describe('parseRange validation', () => {
    it('should reject invalid "to" date', async () => {
      await expect(
        service.getOrdersReport('tenant-1', '2026-02-01', 'invalid-date'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('should reject invalid "from" date', async () => {
      await expect(
        service.getOrdersReport('tenant-1', 'invalid-date', '2026-02-28'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
