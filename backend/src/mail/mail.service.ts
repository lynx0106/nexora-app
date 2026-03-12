import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type * as nodemailerTypes from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import { Tenant } from '../tenants/entities/tenant.entity';

export interface SendMailOptions {
  to: string;
  subject: string;
  replyTo?: string;
  template?: string;
  context?: Record<string, unknown>;
  html?: string;
  text?: string;
  [key: string]: unknown;
}

/** Injectable for tests - allows mocking the transport */
export const MAIL_TRANSPORT = Symbol('MAIL_TRANSPORT');

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly templatesDir: string;
  private readonly defaultFrom: string;
  private templateCache = new Map<string, handlebars.TemplateDelegate>();

  constructor(
    private config: ConfigService,
    @Optional() @Inject(MAIL_TRANSPORT) transport?: nodemailer.Transporter,
  ) {
    if (transport) {
      this.transporter = transport;
    } else {
      const host = this.config.get('SMTP_HOST') || 'localhost';
      const port = Number(this.config.get('SMTP_PORT')) || 587;
      const secure = port === 465;
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user: this.config.get('SMTP_USER'),
          pass: this.config.get('SMTP_PASS'),
        },
      });
    }
    this.defaultFrom = this.config.get('SMTP_FROM') || 'noreply@example.com';
    this.templatesDir = path.join(__dirname, 'templates');
  }

  private getTemplate(name: string): handlebars.TemplateDelegate {
    let compiled = this.templateCache.get(name);
    if (!compiled) {
      const filePath = path.join(this.templatesDir, `${name}.hbs`);
      const source = fs.readFileSync(filePath, 'utf-8');
      compiled = handlebars.compile(source, { strict: true });
      this.templateCache.set(name, compiled);
    }
    return compiled;
  }

  private async sendWithTemplate(
    to: string,
    subject: string,
    templateName: string,
    context: Record<string, unknown>,
    replyTo?: string,
  ): Promise<void> {
    const template = this.getTemplate(templateName);
    const html = template(context);

    await this.transporter.sendMail({
      from: `"No Reply" <${this.defaultFrom}>`,
      to,
      subject,
      replyTo,
      html,
    });
  }

  async sendOrderConfirmation(
    order: {
      id: string;
      customerEmail?: string;
      customerName?: string;
      total: number | string;
      publicToken?: string;
      items: Array<{
        product: { name: string };
        quantity: number;
        price: number | string;
      }>;
    },
    tenant: Tenant,
  ): Promise<void> {
    if (!order.customerEmail) {
      this.logger.warn(
        `Cannot send order confirmation: Missing email for order ${order.id}`,
      );
      return;
    }

    const baseUrl = process.env.FRONTEND_URL || 'https://nexora-app.online';
    const tokenQuery = order.publicToken ? `?token=${order.publicToken}` : '';
    const url = `${baseUrl}/orders/status/${order.id}${tokenQuery}`;

    const formatter = new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: tenant.currency || 'USD',
    });

    const items = order.items.map((item) => ({
      productName: item.product.name,
      quantity: item.quantity,
      price: formatter.format(Number(item.price) * item.quantity),
    }));

    try {
      await this.sendWithTemplate(
        order.customerEmail,
        `Confirmación de Pedido #${order.id.slice(0, 8)} - ${tenant.name}`,
        'order-confirmation',
        {
          customerName: order.customerName || 'Cliente',
          orderId: order.id.slice(0, 8),
          total: formatter.format(Number(order.total)),
          items,
          tenantName: tenant.name,
          tenantAddress: tenant.address || 'Dirección no disponible',
          url,
          year: new Date().getFullYear(),
        },
        tenant.email || 'no-reply@nexora.com',
      );
      this.logger.log(`Email sent to ${order.customerEmail}`);
    } catch (error) {
      this.logger.error('Error sending order confirmation:', error);
    }
  }

  async sendAppointmentConfirmation(
    appointment: {
      id: string;
      dateTime: string | Date;
      client?: { email?: string; firstName?: string; name?: string };
      service?: { name?: string };
      doctor?: { firstName?: string; name?: string };
    },
    tenant: Tenant,
  ): Promise<void> {
    const email = appointment.client?.email;
    if (!email) {
      this.logger.warn(
        `Cannot send appointment confirmation: Missing client email for appointment ${appointment.id}`,
      );
      return;
    }

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

    try {
      await this.sendWithTemplate(
        email,
        `Confirmación de Cita - ${tenant.name}`,
        'appointment-confirmation',
        {
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
        tenant.email,
      );
      this.logger.log(`Appointment confirmation email sent to ${email}`);
    } catch (error) {
      this.logger.error('Error sending appointment confirmation:', error);
    }
  }

  async sendAppointmentReminder(
    appointment: {
      id: string;
      dateTime: string | Date;
      client?: { email?: string; firstName?: string; name?: string };
      service?: { name?: string };
      doctor?: { firstName?: string; name?: string };
    },
    tenant: Tenant,
    type: '24h' | '2h',
  ): Promise<void> {
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

    const subject =
      type === '24h'
        ? `Recordatorio: Tu cita es mañana - ${tenant.name}`
        : `Recordatorio: Tu cita es en 2 horas - ${tenant.name}`;

    try {
      await this.sendWithTemplate(
        email,
        subject,
        'appointment-reminder',
        {
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
          type,
          year: new Date().getFullYear(),
        },
        tenant.email,
      );
      this.logger.log(`Appointment reminder (${type}) sent to ${email}`);
    } catch (error) {
      this.logger.error(`Error sending appointment reminder (${type}):`, error);
    }
  }

  async sendPasswordReset(data: {
    email: string;
    firstName?: string;
    token: string;
  }): Promise<void> {
    const baseUrl = process.env.FRONTEND_URL || 'https://nexora-app.online';
    const url = `${baseUrl}/auth/reset-password?token=${data.token}`;

    try {
      await this.sendWithTemplate(
        data.email,
        'Restablecer tu contrasena',
        'password-reset',
        {
          customerName: data.firstName || 'Cliente',
          url,
          year: new Date().getFullYear(),
        },
      );
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
  }): Promise<void> {
    const baseUrl = process.env.FRONTEND_URL || 'https://nexora-app.online';
    const url = `${baseUrl}/auth/invite?token=${data.token}`;

    try {
      await this.sendWithTemplate(
        data.email,
        `Invitacion a ${data.tenantName}`,
        'invitation',
        {
          tenantName: data.tenantName,
          role: data.role,
          inviterName: data.inviterName,
          url,
          year: new Date().getFullYear(),
        },
      );
      this.logger.log(`Invitation email sent to ${data.email}`);
    } catch (error) {
      this.logger.error('Error sending invitation email:', error);
    }
  }

  async sendMail(
    options: SendMailOptions,
  ): Promise<nodemailerTypes.SentMessageInfo> {
    const { to, subject, replyTo, template, context, html, text, ...rest } =
      options;

    let finalHtml = html;
    if (template && context) {
      const templateName = template.replace(/^\.\//, '');
      const compiled = this.getTemplate(templateName);
      finalHtml = compiled(context);
    }

    return this.transporter.sendMail({
      from: `"No Reply" <${this.defaultFrom}>`,
      to,
      subject,
      replyTo,
      html: finalHtml,
      text,
      ...rest,
    });
  }
}
