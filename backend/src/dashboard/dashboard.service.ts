import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrdersService } from '../orders/orders.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { Tenant } from '../tenants/entities/tenant.entity';
import { Order } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { User } from '../users/entities/user.entity';

export interface BusinessMetrics {
  businessType: string;
  tenantName: string;
  general: {
    totalSales: number;
    totalOrders: number;
    totalAppointments: number;
    averageTicket: number;
  };
  specific: Record<string, any>;
  charts: {
    salesByDate: { date: string; total: number }[];
    topProducts?: { name: string; quantity: number; revenue: number }[];
    appointmentsByStatus?: { status: string; count: number }[];
    salesByHour?: { hour: number; count: number }[];
  };
}

@Injectable()
export class DashboardService {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly appointmentsService: AppointmentsService,
    @InjectRepository(Tenant)
    private tenantsRepository: Repository<Tenant>,
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    @InjectRepository(Appointment)
    private appointmentsRepository: Repository<Appointment>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getDashboardByBusinessType(tenantId: string): Promise<BusinessMetrics> {
    const tenant = await this.tenantsRepository.findOne({ where: { id: tenantId } });
    if (!tenant) {
      throw new Error('Tenant not found');
    }

    const businessType = tenant.businessType || 'other';

    // Get general metrics
    const [orders, appointments, totalSalesResult] = await Promise.all([
      this.ordersRepository.find({ where: { tenantId } }),
      this.appointmentsRepository.find({ where: { tenantId } }),
      this.ordersRepository
        .createQueryBuilder('order')
        .select('SUM(order.total)', 'total')
        .where('order.tenantId = :tenantId', { tenantId })
        .getRawOne(),
    ]);

    const totalSales = Number(totalSalesResult?.total || 0);
    const totalOrders = orders.length;
    const totalAppointments = appointments.length;
    const averageTicket = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Get specific metrics by business type
    const specific = await this.getSpecificMetrics(tenantId, businessType);

    // Get charts data
    const charts = await this.getChartsData(tenantId, businessType);

    return {
      businessType,
      tenantName: tenant.name,
      general: {
        totalSales,
        totalOrders,
        totalAppointments,
        averageTicket,
      },
      specific,
      charts,
    };
  }

  private async getSpecificMetrics(tenantId: string, businessType: string): Promise<Record<string, any>> {
    switch (businessType) {
      case 'restaurant':
        return await this.getRestaurantMetrics(tenantId);
      case 'hotel':
        return await this.getHotelMetrics(tenantId);
      case 'clinic':
        return await this.getClinicMetrics(tenantId);
      case 'retail':
        return await this.getRetailMetrics(tenantId);
      case 'services':
        return await this.getServicesMetrics(tenantId);
      case 'gym':
        return await this.getGymMetrics(tenantId);
      case 'salon':
        return await this.getSalonMetrics(tenantId);
      default:
        return await this.getDefaultMetrics(tenantId);
    }
  }

  private async getRestaurantMetrics(tenantId: string): Promise<Record<string, any>> {
    const tenant = await this.tenantsRepository.findOne({ where: { id: tenantId } });
    const tablesCount = tenant?.tablesCount || 0;

    // Peak hours analysis
    const orders = await this.ordersRepository
      .createQueryBuilder('order')
      .where('order.tenantId = :tenantId', { tenantId })
      .getMany();

    const salesByHour: Record<number, number> = {};
    orders.forEach((order) => {
      const hour = new Date(order.createdAt).getHours();
      salesByHour[hour] = (salesByHour[hour] || 0) + 1;
    });

    const peakHour = Object.entries(salesByHour).sort(([, a], [, b]) => b - a)[0];

    // Today's orders
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayOrders = await this.ordersRepository.count({
      where: {
        tenantId,
        createdAt: { $gte: today } as any,
      },
    });

    return {
      tablesCount,
      peakHour: peakHour ? parseInt(peakHour[0]) : null,
      peakHourOrders: peakHour ? peakHour[1] : 0,
      todayOrders,
      averageOrdersPerDay: orders.length > 0 ? Math.ceil(orders.length / 30) : 0,
    };
  }

  private async getHotelMetrics(tenantId: string): Promise<Record<string, any>> {
    const tenant = await this.tenantsRepository.findOne({ where: { id: tenantId } });
    const capacity = tenant?.capacity || 0;

    // Check-ins and check-outs (simulated with appointments)
    const today = new Date();
    const appointments = await this.appointmentsRepository.find({ where: { tenantId } });

    const checkInsToday = appointments.filter((a) => {
      const date = new Date(a.dateTime);
      return date.toDateString() === today.toDateString() && a.status === 'confirmed';
    }).length;

    const checkOutsToday = appointments.filter((a) => {
      const date = new Date(a.dateTime);
      return date.toDateString() === today.toDateString() && a.status === 'completed';
    }).length;

    return {
      totalRooms: capacity,
      checkInsToday,
      checkOutsToday,
      occupancyRate: capacity > 0 ? Math.round((checkInsToday / capacity) * 100) : 0,
    };
  }

  private async getClinicMetrics(tenantId: string): Promise<Record<string, any>> {
    const appointments = await this.appointmentsRepository.find({ where: { tenantId } });

    const completedAppointments = appointments.filter((a) => a.status === 'completed').length;
    const pendingAppointments = appointments.filter((a) => a.status === 'pending').length;
    const cancelledAppointments = appointments.filter((a) => a.status === 'cancelled').length;

    // Doctors count
    const doctors = await this.usersRepository.count({
      where: { tenantId, role: 'doctor' },
    });

    return {
      totalPatients: appointments.length,
      completedAppointments,
      pendingAppointments,
      cancelledAppointments,
      doctorsCount: doctors,
      completionRate: appointments.length > 0 ? Math.round((completedAppointments / appointments.length) * 100) : 0,
    };
  }

  private async getRetailMetrics(tenantId: string): Promise<Record<string, any>> {
    // Low stock products
    const lowStockProducts = await this.productsRepository
      .createQueryBuilder('product')
      .where('product.tenantId = :tenantId', { tenantId })
      .andWhere('product.stock <= :threshold', { threshold: 10 })
      .getMany();

    // Out of stock products
    const outOfStockProducts = await this.productsRepository
      .createQueryBuilder('product')
      .where('product.tenantId = :tenantId', { tenantId })
      .andWhere('product.stock = 0')
      .getCount();

    // Total products
    const totalProducts = await this.productsRepository.count({ where: { tenantId } });

    return {
      lowStockCount: lowStockProducts.length,
      outOfStockCount: outOfStockProducts,
      totalProducts,
      lowStockProducts: lowStockProducts.slice(0, 5).map((p) => ({
        name: p.name,
        stock: p.stock,
      })),
    };
  }

  private async getServicesMetrics(tenantId: string): Promise<Record<string, any>> {
    const appointments = await this.appointmentsRepository.find({ where: { tenantId } });

    const completedAppointments = appointments.filter((a) => a.status === 'completed').length;
    const cancelledAppointments = appointments.filter((a) => a.status === 'cancelled').length;

    // Staff count
    const staff = await this.usersRepository.count({
      where: { tenantId, role: 'staff' },
    });

    return {
      totalServices: appointments.length,
      completedServices: completedAppointments,
      cancelledServices: cancelledAppointments,
      staffCount: staff,
      completionRate: appointments.length > 0 ? Math.round((completedAppointments / appointments.length) * 100) : 0,
    };
  }

  private async getGymMetrics(tenantId: string): Promise<Record<string, any>> {
    // Active members
    const activeMembers = await this.usersRepository.count({
      where: { tenantId, role: 'user', isActive: true },
    });

    // Total members
    const totalMembers = await this.usersRepository.count({
      where: { tenantId, role: 'user' },
    });

    // Today's check-ins (simulated with appointments)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCheckIns = await this.appointmentsRepository.count({
      where: {
        tenantId,
        createdAt: { $gte: today } as any,
      },
    });

    return {
      activeMembers,
      totalMembers,
      todayCheckIns,
      retentionRate: totalMembers > 0 ? Math.round((activeMembers / totalMembers) * 100) : 0,
    };
  }

  private async getSalonMetrics(tenantId: string): Promise<Record<string, any>> {
    const appointments = await this.appointmentsRepository.find({ where: { tenantId } });

    // Popular services
    const serviceCounts: Record<string, number> = {};
    appointments.forEach((a) => {
      const service = a.service?.name || 'General';
      serviceCounts[service] = (serviceCounts[service] || 0) + 1;
    });

    const popularServices = Object.entries(serviceCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Stylists count
    const stylists = await this.usersRepository.count({
      where: { tenantId, role: 'staff' },
    });

    return {
      totalAppointments: appointments.length,
      popularServices,
      stylistsCount: stylists,
      averageAppointmentsPerDay: appointments.length > 0 ? Math.ceil(appointments.length / 30) : 0,
    };
  }

  private async getDefaultMetrics(tenantId: string): Promise<Record<string, any>> {
    const orders = await this.ordersRepository.find({ where: { tenantId } });
    const appointments = await this.appointmentsRepository.find({ where: { tenantId } });

    return {
      totalOrders: orders.length,
      totalAppointments: appointments.length,
    };
  }

  private async getChartsData(tenantId: string, businessType: string): Promise<any> {
    const salesByDate = await this.getSalesChart(tenantId);
    const topProducts = await this.getTopProducts(tenantId);
    const appointmentsByStatus = await this.getAppointmentsByStatus(tenantId);
    const salesByHour = await this.getSalesByHour(tenantId);

    return {
      salesByDate,
      topProducts: ['restaurant', 'retail', 'services'].includes(businessType) ? topProducts : undefined,
      appointmentsByStatus: ['clinic', 'hotel', 'services', 'gym', 'salon'].includes(businessType)
        ? appointmentsByStatus
        : undefined,
      salesByHour: businessType === 'restaurant' ? salesByHour : undefined,
    };
  }

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
        amount: 0,
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

  private async getTopProducts(tenantId: string): Promise<{ name: string; quantity: number; revenue: number }[]> {
    const orders = await this.ordersRepository.find({
      where: { tenantId },
      relations: ['items', 'items.product'],
    });

    const productStats: Record<string, { quantity: number; revenue: number; name: string }> = {};

    orders.forEach((order) => {
      order.items?.forEach((item) => {
        const productId = item.productId;
        if (!productStats[productId]) {
          productStats[productId] = {
            name: item.product?.name || 'Producto',
            quantity: 0,
            revenue: 0,
          };
        }
        productStats[productId].quantity += item.quantity;
        productStats[productId].revenue += Number(item.price) * item.quantity;
      });
    });

    return Object.values(productStats)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }

  private async getAppointmentsByStatus(tenantId: string): Promise<{ status: string; count: number }[]> {
    const appointments = await this.appointmentsRepository.find({ where: { tenantId } });

    const statusCounts: Record<string, number> = {};
    appointments.forEach((a) => {
      statusCounts[a.status] = (statusCounts[a.status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([status, count]) => ({ status, count }));
  }

  private async getSalesByHour(tenantId: string): Promise<{ hour: number; count: number }[]> {
    const orders = await this.ordersRepository.find({ where: { tenantId } });

    const hourCounts: Record<number, number> = {};
    for (let i = 0; i < 24; i++) {
      hourCounts[i] = 0;
    }

    orders.forEach((order) => {
      const hour = new Date(order.createdAt).getHours();
      hourCounts[hour]++;
    });

    return Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .filter((h) => h.count > 0)
      .sort((a, b) => a.hour - b.hour);
  }
}
