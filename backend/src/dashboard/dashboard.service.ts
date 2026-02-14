import { Injectable } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { AppointmentsService } from '../appointments/appointments.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly appointmentsService: AppointmentsService,
  ) {}

  async getRecentActivity(tenantId: string, userId?: string) {
    const [orders, appointments] = await Promise.all([
      this.ordersService.findRecent(tenantId, 10, userId),
      this.appointmentsService.findRecent(tenantId, 10, userId),
    ]);

    const activity = [
      ...orders.map((o) => ({
        type: 'order',
        id: o.id,
        date: o.createdAt,
        title: `Nuevo Pedido #${o.id.slice(0, 8)}`,
        description: `${o.user?.firstName || 'Cliente'} - $${Number(o.total).toFixed(2)}`,
        status: o.status,
        amount: o.total,
      })),
      ...appointments.map((a) => ({
        type: 'appointment',
        id: a.id,
        date: a.createdAt,
        title: `Nueva Cita - ${a.service?.name || 'Servicio'}`,
        description: `${a.client?.firstName || 'Cliente'} - ${new Date(a.dateTime).toLocaleDateString()}`,
        status: a.status,
        amount: 0, // Appointments might not have a direct 'price' stored on the entity easily accessible here without service lookup, keeping simple.
      })),
    ];

    return activity
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
  }

  async getSalesChart(tenantId: string) {
    const days = 7;
    const orders = await this.ordersService.getDailySales(tenantId, days);

    const salesByDate: Record<string, number> = {};

    // Initialize last 7 days with 0
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      salesByDate[dateStr] = 0;
    }

    orders.forEach((o) => {
      const dateStr = o.createdAt.toISOString().split('T')[0];
      if (salesByDate[dateStr] !== undefined) {
        salesByDate[dateStr] += Number(o.total);
      }
    });

    return Object.entries(salesByDate)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }
}
