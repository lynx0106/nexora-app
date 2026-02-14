import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { Order } from '../orders/entities/order.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    @InjectRepository(Tenant)
    private tenantsRepository: Repository<Tenant>,
    private mailService: MailService,
  ) {}

  // Helper to get client based on tenant or global config
  private getClient(tenant?: Tenant) {
    const accessToken =
      tenant?.mercadoPagoAccessToken || process.env.MP_ACCESS_TOKEN;

    if (!accessToken) {
      throw new InternalServerErrorException(
        'MercadoPago Access Token not configured for this tenant',
      );
    }

    return new MercadoPagoConfig({ accessToken });
  }

  async createPreference(order: Order, tenant: Tenant) {
    try {
      const client = this.getClient(tenant);
      const preference = new Preference(client);

      const items = order.items.map((item) => ({
        id: item.productId,
        title: 'Product ' + item.productId, // Ideally, fetch product name properly
        quantity: item.quantity,
        unit_price: Number(item.price),
        currency_id: tenant.currency || 'COP',
      }));

      // Add "envío" or shipping logic if needed, but for now we trust items total matches logic

      const result = await preference.create({
        body: {
          items,
          payer: {
            email: order.customerEmail || 'test_user_123456@testuser.com', // Use a valid email or placeholder
          },
          back_urls: {
            success: `https://nexora-app.online/orders/thank-you?orderId=${order.id}&status=success`, // Changed to https for validation
            failure: `https://nexora-app.online/orders/thank-you?orderId=${order.id}&status=failure`,
            pending: `https://nexora-app.online/orders/thank-you?orderId=${order.id}&status=pending`,
          },
          auto_return: 'approved',
          external_reference: order.id, // CRITICAL: This links the payment to our Order ID
          notification_url: `https://nexora-app.online/api/payments/webhook?tenantId=${tenant.id}`, // Must be HTTPS and public
        },
      });

      return {
        preferenceId: result.id,
        initPoint: result.init_point, // URL to redirect user
        sandboxInitPoint: result.sandbox_init_point,
      };
    } catch (error) {
      console.error('Error creating MercadoPago preference:', error);
      throw new InternalServerErrorException(
        'Failed to create payment preference',
      );
    }
  }

  async processPaymentNotification(paymentId: string, tenantId?: string) {
    try {
      let tenant: Tenant | null = null;
      if (tenantId) {
        tenant = await this.tenantsRepository.findOne({
          where: { id: tenantId },
        });
      }

      const client = this.getClient(tenant || undefined); // Use tenant token if available
      const payment = new Payment(client);

      let paymentData;
      if (paymentId.startsWith('sim_')) {
        this.logger.log(`[SIMULATION] Processing simulated payment ${paymentId}`);
        // Extract orderId from the simulation ID if possible, or rely on a lookup
        // Format: sim_ORDERID_STATUS
        const parts = paymentId.split('_');
        const simulatedOrderId = parts[1]; // e.g. "sim_uuid-of-order_approved"
        const simulatedStatus = parts[2] || 'approved';
        
        paymentData = {
          id: parseInt(parts[3] || '123456789'),
          status: simulatedStatus,
          external_reference: simulatedOrderId,
          status_detail: 'accredited',
          payment_method_id: 'visa',
          transaction_amount: 100,
        };
      } else {
        paymentData = await payment.get({ id: paymentId });
      }

      if (!paymentData) {
        this.logger.error(`Payment ${paymentId} not found in MercadoPago`);
        return;
      }

      const { status, external_reference } = paymentData;
      const orderId = external_reference;

      if (!orderId) {
        this.logger.warn(
          `Payment ${paymentId} has no external_reference (Order ID)`,
        );
        return;
      }

      const order = await this.ordersRepository.findOne({
        where: { id: orderId },
        relations: ['tenant', 'items', 'items.product'],
      });
      if (!order) {
        this.logger.error(
          `Order ${orderId} not found for Payment ${paymentId}`,
        );
        return;
      }

      // Validate status
      if (status === 'approved' && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid';
        order.status = 'completed'; // Changed to 'completed' to match frontend expectations
        await this.ordersRepository.save(order);

        this.logger.log(`Order ${orderId} marked as PAID via Webhook`);

        // Prepare email data
        const formatter = new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: order.tenant.currency || 'USD',
        });

        const emailItems = order.items.map((item) => ({
          productName: item.product?.name || 'Producto',
          quantity: item.quantity,
          price: formatter.format(Number(item.price) * item.quantity),
        }));

        const totalFormatted = formatter.format(Number(order.total));

        // Send Email Notifications
        
        // 1. To Customer
        if (order.customerEmail) {
          await this.mailService.sendMail({
            to: order.customerEmail,
            subject: `¡Pago Recibido! Tu pedido #${order.id.slice(0, 8)} está confirmado`,
            template: './order-confirmation',
            context: {
              orderId: order.id.slice(0, 8),
              total: totalFormatted,
              items: emailItems,
              businessName: order.tenant.name,
              tenantName: order.tenant.name,
              customerName: order.customerName || 'Cliente',
              url: `https://nexora-app.online/orders/status/${order.id}`,
              tenantAddress: order.tenant.address || '',
            },
          });
          this.logger.log(`Payment confirmation email sent to Customer: ${order.customerEmail}`);
        }

        // 2. To Tenant (Business)
        if (order.tenant?.email) {
          await this.mailService.sendMail({
            to: order.tenant.email,
            subject: `Nuevo Pago Recibido - Pedido #${order.id.slice(0, 8)}`,
            template: './order-confirmation', 
            context: {
              orderId: order.id.slice(0, 8),
              total: totalFormatted,
              items: emailItems,
              businessName: order.tenant.name,
              tenantName: order.tenant.name,
              customerName: 'Admin', // Addressing the admin
              url: `https://nexora-app.online/dashboard/orders`,
              tenantAddress: order.tenant.address || '',
              isAdminNotification: true,
            },
          });
          this.logger.log(`Payment notification email sent to Tenant: ${order.tenant.email}`);
        } else {
            this.logger.warn(`Tenant ${order.tenant.id} has no email configured for notifications.`);
        }
      }
    } catch (error) {
      this.logger.error(
        `Error processing payment notification ${paymentId}`,
        error,
      );
    }
  }
}
