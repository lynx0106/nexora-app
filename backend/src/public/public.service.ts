import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TenantsService } from '../tenants/tenants.service';
import { ProductsService } from '../products/products.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { UsersService } from '../users/users.service';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class PublicService {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly productsService: ProductsService,
    private readonly appointmentsService: AppointmentsService,
    private readonly usersService: UsersService,
    private readonly ordersService: OrdersService,
  ) {}

  async getTenantInfo(tenantId: string) {
    const tenant = await this.tenantsService.findOne(tenantId);
    if (!tenant) throw new NotFoundException('Empresa no encontrada');

    // Return only safe public info
    return {
      id: tenant.id,
      name: tenant.name,
      sector: tenant.sector,
      city: tenant.city,
      address: tenant.address,
      logoUrl: tenant.logoUrl,
      coverUrl: tenant.coverUrl,
      openingTime: tenant.openingTime,
      closingTime: tenant.closingTime,
      appointmentDuration: tenant.appointmentDuration,
      currency: tenant.currency,
    };
  }

  async getTenantServices(tenantId: string) {
    const products = await this.productsService.findAllByTenant(tenantId);
    // Filter only services (products with duration) for the booking flow
    return products.filter((p) => p.duration && p.duration > 0);
  }

  async getTenantProducts(tenantId: string) {
    const products = await this.productsService.findAllByTenant(tenantId);
    // Filter only physical products (no duration) for the store flow
    return products.filter((p) => !p.duration || p.duration === 0);
  }

  async getAvailability(tenantId: string, dateStr: string) {
    const tenant = await this.tenantsService.findOne(tenantId);
    if (!tenant) throw new BadRequestException('Tenant no encontrado');

    const startHour = parseInt(tenant.openingTime.split(':')[0], 10);
    const endHour = parseInt(tenant.closingTime.split(':')[0], 10);
    const duration = tenant.appointmentDuration || 60;

    // Fix: Parse date manually to avoid timezone shifts (treat as local date)
    const [year, month, day] = dateStr.split('-').map(Number);
    const date = new Date(year, month - 1, day);

    if (isNaN(date.getTime())) {
      throw new BadRequestException('Fecha inválida');
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await this.appointmentsService.findByDateRange(
      tenantId,
      startOfDay,
      endOfDay,
    );

    const slots: string[] = [];

    // Generate slots based on duration (minutes)
    const startMinutes =
      startHour * 60 + parseInt(tenant.openingTime.split(':')[1] || '0', 10);
    const endMinutes =
      endHour * 60 + parseInt(tenant.closingTime.split(':')[1] || '0', 10);

    for (let m = startMinutes; m < endMinutes; m += duration) {
      const slotHour = Math.floor(m / 60);
      const slotMinute = m % 60;

      const slotTime = new Date(date);
      slotTime.setHours(slotHour, slotMinute, 0, 0);

      // Check if any appointment starts at this time
      const isTaken = appointments.some((appt) => {
        const apptTime = new Date(appt.dateTime);
        return (
          apptTime.getHours() === slotTime.getHours() &&
          apptTime.getMinutes() === slotTime.getMinutes() &&
          appt.status !== 'cancelled'
        );
      });

      if (!isTaken) {
        slots.push(slotTime.toISOString());
      }
    }

    return slots;
  }

  async createAppointment(
    tenantId: string,
    data: {
      serviceId: string;
      dateTime: string;
      client: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        notes?: string;
      };
    },
  ) {
    // 1. Find or create client
    let user = await this.usersService.findByEmail(data.client.email);

    if (!user) {
      // Create new client
      const tempPassword = Math.random().toString(36).slice(-8);
      user = await this.usersService.createUserForTenant(tenantId, {
        firstName: data.client.firstName,
        lastName: data.client.lastName,
        email: data.client.email,
        phone: data.client.phone,
        password: tempPassword,
        role: 'user',
      });
    }

    // 2. Create Appointment
    return this.appointmentsService.create({
      tenantId,
      dateTime: data.dateTime, // Pass as string to match DTO
      clientId: user.id,
      serviceId: data.serviceId,
      notes: data.client.notes,
    });
  }

  async createOrder(
    tenantId: string,
    data: {
      items: { productId: string; quantity: number; price: number }[];
      client: {
        firstName: string;
        lastName: string;
        email: string;
        address?: string;
        city?: string;
        phone?: string;
      };
    },
  ) {
    // 1. Find or create client
    let user = await this.usersService.findByEmail(data.client.email);

    if (!user) {
      const tempPassword = Math.random().toString(36).slice(-8);
      user = await this.usersService.createUserForTenant(tenantId, {
        firstName: data.client.firstName,
        lastName: data.client.lastName,
        email: data.client.email,
        phone: data.client.phone,
        password: tempPassword,
        role: 'user',
        address: data.client.address,
      });
    }

    // 2. Create Order
    return this.ordersService.create({
      tenantId,
      userId: user.id,
      items: data.items,
      shippingAddress: {
        street: data.client.address,
        city: data.client.city,
      },
      customerEmail: data.client.email,
      paymentMethod: 'card', // Default to card for online orders to trigger Payment Link generation
    });
  }

  async getOrderStatus(orderId: string) {
    const order = await this.ordersService.findOne(orderId);
    if (!order) throw new NotFoundException('Pedido no encontrado');

    // Return only safe info for public view
    return {
      id: order.id,
      createdAt: order.createdAt,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      total: order.total,
      currency: order.tenant?.currency || 'USD',
      items: order.items.map((i) => ({
        productName: i.product.name,
        quantity: i.quantity,
        price: i.price,
        imageUrl: i.product.imageUrl,
      })),
      shippingAddress: order.shippingAddress,
      customerEmail: order.customerEmail, // Maybe hide part of it? For now it's fine as verification
      paymentLink: order.paymentStatus === 'pending' ? order.paymentLink : null,
      tenant: {
        name: order.tenant.name,
        logoUrl: order.tenant.logoUrl,
        phone: order.tenant.phone,
      },
    };
  }
}
