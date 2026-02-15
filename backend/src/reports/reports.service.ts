import { BadRequestException } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { OrdersService } from '../orders/orders.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { UsersService } from '../users/users.service';

const DEFAULT_RANGE_DAYS = 30;

@Injectable()
export class ReportsService {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly appointmentsService: AppointmentsService,
    private readonly usersService: UsersService,
  ) {}

  async getOrdersReport(
    tenantId: string,
    from: string | undefined,
    to: string | undefined,
    userId?: string,
  ) {
    const { start, end } = this.parseRange(from, to);
    const orders = await this.ordersService.findForReport(tenantId, start, end, userId);

    return orders.map((order) => ({
      id: order.id,
      createdAt: order.createdAt?.toISOString(),
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      total: Number(order.total),
      currency: order.tenant?.currency || 'USD',
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      userId: order.userId,
      tenantId: order.tenantId,
    }));
  }

  async getAppointmentsReport(
    tenantId: string,
    from: string | undefined,
    to: string | undefined,
    userId?: string,
  ) {
    const { start, end } = this.parseRange(from, to);
    const appointments = await this.appointmentsService.findForReport(
      tenantId,
      start,
      end,
      userId,
    );

    return appointments.map((appointment) => ({
      id: appointment.id,
      dateTime: appointment.dateTime?.toISOString(),
      status: appointment.status,
      serviceName: appointment.service?.name,
      doctorName: appointment.doctor
        ? `${appointment.doctor.firstName || ''} ${appointment.doctor.lastName || ''}`.trim()
        : '',
      clientName: appointment.client
        ? `${appointment.client.firstName || ''} ${appointment.client.lastName || ''}`.trim()
        : '',
      clientEmail: appointment.client?.email,
      tenantId: appointment.tenantId,
    }));
  }

  async getUsersReport(
    tenantId: string,
    from: string | undefined,
    to: string | undefined,
  ) {
    const { start, end } = this.parseRange(from, to);
    const users = await this.usersService.findForReport(tenantId, start, end);

    return users.map((user) => ({
      id: user.id,
      createdAt: user.createdAt?.toISOString(),
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      tenantId: user.tenantId,
    }));
  }

  respondWithFormat(
    res: Response,
    rows: Array<Record<string, unknown>>,
    format: string | undefined,
    filenameBase: string,
  ) {
    const normalized = (format || 'csv').toLowerCase();

    if (normalized === 'json') {
      return { count: rows.length, data: rows };
    }

    if (normalized !== 'csv') {
      throw new BadRequestException('Formato no soportado');
    }

    const csv = this.toCsv(rows);
    const filename = `${filenameBase}-${this.formatDate(new Date())}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return csv;
  }

  private parseRange(from?: string, to?: string) {
    const end = to ? new Date(to) : new Date();
    if (Number.isNaN(end.getTime())) {
      throw new BadRequestException('Parametro to invalido');
    }

    let start: Date;
    if (from) {
      start = new Date(from);
      if (Number.isNaN(start.getTime())) {
        throw new BadRequestException('Parametro from invalido');
      }
    } else {
      start = new Date(end);
      start.setDate(start.getDate() - DEFAULT_RANGE_DAYS);
    }

    if (start > end) {
      throw new BadRequestException('Rango de fechas invalido');
    }

    return { start, end };
  }

  private toCsv(rows: Array<Record<string, unknown>>) {
    if (!rows.length) {
      return '';
    }

    const headers = Object.keys(rows[0]);
    const lines = [headers.join(',')];

    for (const row of rows) {
      const values = headers.map((header) => this.escapeCsv(row[header]));
      lines.push(values.join(','));
    }

    return lines.join('\n');
  }

  private escapeCsv(value: unknown) {
    if (value === null || value === undefined) return '';
    const str = String(value);

    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
  }

  private formatDate(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}${m}${d}`;
  }
}
