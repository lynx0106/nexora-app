import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { Order } from '../orders/entities/order.entity';
import { Tenant } from '../tenants/entities/tenant.entity';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private mailerService: MailerService) {}

  async sendOrderConfirmation(order: any, tenant: Tenant) {
    if (!order.customerEmail) {
      this.logger.warn(
        `Cannot send order confirmation: Missing email for order ${order.id}`,
      );
      return;
    }

    const baseUrl = process.env.FRONTEND_URL || 'https://nexora-app.online';
    const tokenQuery = order.publicToken ? `?token=${order.publicToken}` : '';
    const url = `${baseUrl}/orders/status/${order.id}${tokenQuery}`;

    // Format currency
    const formatter = new Intl.NumberFormat('es-CO', {
      // Default to COP/ES for now, ideally dynamic
      style: 'currency',
      currency: tenant.currency || 'USD',
    });

    const items = order.items.map((item) => ({
      productName: item.product.name,
      quantity: item.quantity,
      price: formatter.format(Number(item.price) * item.quantity),
    }));

    try {
      await this.mailerService.sendMail({
        to: order.customerEmail,
        // from: 'onboarding@resend.dev', // Temporary override for testing
        replyTo: tenant.email || 'no-reply@nexora.com',
        subject: `Confirmación de Pedido #${order.id.slice(0, 8)} - ${tenant.name}`,
        template: './order-confirmation', // `.hbs` extension is appended automatically
        context: {
          customerName: order.customerName || 'Cliente',
          orderId: order.id.slice(0, 8),
          total: formatter.format(Number(order.total)),
          items,
          tenantName: tenant.name,
          tenantAddress: tenant.address || 'Dirección no disponible',
          url,
          year: new Date().getFullYear(),
        },
      });
      this.logger.log(`Email sent to ${order.customerEmail}`);
    } catch (error) {
      this.logger.error('Error sending email via MailerService:', error);
      // Do not rethrow, just log.
    }
  }

  async sendAppointmentConfirmation(appointment: any, tenant: Tenant) {
    const email = appointment.client?.email;
    if (!email) {
      this.logger.warn(
        `Cannot send appointment confirmation: Missing client email for appointment ${appointment.id}`,
      );
      return;
    }

    const baseUrl = process.env.FRONTEND_URL || 'https://nexora-app.online';
    const url = `${baseUrl}/dashboard`; // Redirect to dashboard for appointments

    const date = new Date(appointment.dateTime);
    const dateStr = date.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });

    try {
      await this.mailerService.sendMail({
        to: email,
        replyTo: tenant.email,
        subject: `Confirmación de Cita - ${tenant.name}`,
        template: './appointment-confirmation',
        context: {
          customerName:
            appointment.client?.firstName ||
            appointment.client?.name ||
            'Cliente',
          serviceName: appointment.service?.name || 'Servicio',
          doctorName:
            appointment.doctor?.firstName ||
            appointment.doctor?.name ||
            'Especialista',
          date: dateStr,
          time: timeStr,
          tenantName: tenant.name,
          tenantAddress: tenant.address || 'Dirección no disponible',
          url,
          year: new Date().getFullYear(),
        },
      });
      this.logger.log(`Appointment confirmation email sent to ${email}`);
    } catch (error) {
      this.logger.error('Error sending appointment confirmation email:', error);
    }
  }

  async sendAppointmentReminder(appointment: any, tenant: Tenant, type: '24h' | '2h') {
    const email = appointment.client?.email;
    if (!email) return;

    const baseUrl = process.env.FRONTEND_URL || 'https://nexora-app.online';
    const url = `${baseUrl}/dashboard`;

    const date = new Date(appointment.dateTime);
    const dateStr = date.toLocaleDateString('es-CO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('es-CO', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const subject = type === '24h' 
      ? `Recordatorio: Tu cita es mañana - ${tenant.name}`
      : `Recordatorio: Tu cita es en 2 horas - ${tenant.name}`;
    
    // Ideally use a different template, but for MVP we can reuse or clone
    // Let's assume we reuse but change the title via context if the template supports it
    // Or simpler: create a 'appointment-reminder' template. 
    // For now, I'll reuse 'appointment-confirmation' but pass a custom 'title' if I can edit the template,
    // otherwise just use it as is, the info is the same.
    
    // Let's quickly create a reminder template or just use confirmation with a "Reminder" flag logic if we had it.
    // I'll stick to confirmation template for now but maybe I should create a reminder one.
    // Let's create a reminder template in the next step.

    try {
      await this.mailerService.sendMail({
        to: email,
        replyTo: tenant.email,
        subject: subject,
        template: './appointment-reminder', // I will create this
        context: {
          customerName:
            appointment.client?.firstName ||
            appointment.client?.name ||
            'Cliente',
          serviceName: appointment.service?.name || 'Servicio',
          doctorName:
            appointment.doctor?.firstName ||
            appointment.doctor?.name ||
            'Especialista',
          date: dateStr,
          time: timeStr,
          tenantName: tenant.name,
          tenantAddress: tenant.address || 'Dirección no disponible',
          url,
          type: type, // '24h' or '2h'
          year: new Date().getFullYear(),
        },
      });
      this.logger.log(`Appointment reminder (${type}) sent to ${email}`);
    } catch (error) {
      this.logger.error(`Error sending appointment reminder (${type}):`, error);
    }
  }

  async sendPasswordReset(data: { email: string; firstName?: string; token: string }) {
    const baseUrl = process.env.FRONTEND_URL || 'https://nexora-app.online';
    const url = `${baseUrl}/auth/reset-password?token=${data.token}`;

    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: 'Restablecer tu contrasena',
        template: './password-reset',
        context: {
          customerName: data.firstName || 'Cliente',
          url,
          year: new Date().getFullYear(),
        },
      });
      this.logger.log(`Password reset email sent to ${data.email}`);
    } catch (error) {
      this.logger.error('Error sending password reset email:', error);
    }
  }

  async sendInvitation(data: {
    email: string;
    token: string;
    tenantName: string;
    role: string;
    inviterName?: string;
  }) {
    const baseUrl = process.env.FRONTEND_URL || 'https://nexora-app.online';
    const url = `${baseUrl}/auth/invite?token=${data.token}`;

    try {
      await this.mailerService.sendMail({
        to: data.email,
        subject: `Invitacion a ${data.tenantName}`,
        template: './invitation',
        context: {
          tenantName: data.tenantName,
          role: data.role,
          inviterName: data.inviterName,
          url,
          year: new Date().getFullYear(),
        },
      });
      this.logger.log(`Invitation email sent to ${data.email}`);
    } catch (error) {
      this.logger.error('Error sending invitation email:', error);
    }
  }

  async sendMail(options: any) {
    return this.mailerService.sendMail(options);
  }
}
