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
  private readonly maxWebhookRetries = Number(process.env.MP_WEBHOOK_RETRY_MAX || 3);
  private readonly baseRetryDelayMs = Number(
    process.env.MP_WEBHOOK_RETRY_DELAY_MS || 2000,
  );

  private getFrontendUrl() {
    return (process.env.FRONTEND_URL || 'http://localhost:3002').replace(/\/$/, '');
  }

  private getBackendUrl() {
    return (process.env.BACKEND_URL || 'http://localhost:4001').replace(/\/$/, '');
  }

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
            success: `${this.getFrontendUrl()}/orders/thank-you?orderId=${order.id}&status=success`,
            failure: `${this.getFrontendUrl()}/orders/thank-you?orderId=${order.id}&status=failure`,
            pending: `${this.getFrontendUrl()}/orders/thank-you?orderId=${order.id}&status=pending`,
          },
          auto_return: 'approved',
          external_reference: order.id, // CRITICAL: This links the payment to our Order ID
          notification_url: `${this.getBackendUrl()}/payments/webhook?tenantId=${tenant.id}`,
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

  async processPaymentNotificationWithRetry(paymentId: string, tenantId?: string) {
    await this.processPaymentNotificationOnce(paymentId, tenantId, 1);
  }

  private async processPaymentNotificationOnce(
    paymentId: string,
    tenantId: string | undefined,
    attempt: number,
  ) {
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
        throw new Error(`Pago ${paymentId} no encontrado en MercadoPago`);
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
        throw new Error(`Pedido ${orderId} no encontrado para pago ${paymentId}`);
      }

      const safeMetadata = this.buildPaymentMetadata(paymentData);
      order.mpPaymentId = paymentData?.id ? String(paymentData.id) : order.mpPaymentId;
      order.mpPaymentStatus = status || order.mpPaymentStatus;
      order.mpMetadata = safeMetadata;
      await this.ordersRepository.save(order);

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
              url: `${this.getFrontendUrl()}/orders/status/${order.id}`,
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
              url: `${this.getFrontendUrl()}/dashboard/orders`,
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
      if (attempt < this.maxWebhookRetries) {
        const delay = this.baseRetryDelayMs * Math.pow(2, attempt - 1);
        this.logger.warn(
          `Error procesando webhook ${paymentId}. Reintento ${attempt + 1} en ${delay}ms`,
        );
        setTimeout(() => {
          void this.processPaymentNotificationOnce(paymentId, tenantId, attempt + 1);
        }, delay);
        return;
      }

      this.logger.error(
        `Error procesando webhook ${paymentId} despues de reintentos`,
        error,
      );
    }
  }

  private buildPaymentMetadata(paymentData: any) {
    return {
      id: paymentData?.id ?? null,
      status: paymentData?.status ?? null,
      statusDetail: paymentData?.status_detail ?? null,
      paymentMethodId: paymentData?.payment_method_id ?? null,
      paymentTypeId: paymentData?.payment_type_id ?? null,
      transactionAmount: paymentData?.transaction_amount ?? null,
      currencyId: paymentData?.currency_id ?? null,
      installments: paymentData?.installments ?? null,
      payerEmail: paymentData?.payer?.email ?? null,
      createdAt: paymentData?.date_created ?? null,
      approvedAt: paymentData?.date_approved ?? null,
    };
  }
}
