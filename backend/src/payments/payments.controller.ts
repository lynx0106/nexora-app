import {
  Controller,
  Post,
  Body,
  Query,
  Headers,
  HttpStatus,
  Res,
  Logger,
} from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import type { Response } from 'express';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  private verificarFirmaWebhook(
    signatureHeader: string | undefined,
    requestId: string | undefined,
    notifId: string | undefined,
  ): boolean {
    const secret = process.env.MP_WEBHOOK_SECRET;
    if (!secret) {
      this.logger.warn('MP_WEBHOOK_SECRET no esta configurado');
      return true;
    }

    if (!signatureHeader || !requestId || !notifId) {
      return false;
    }

    const parts = signatureHeader.split(',').map((part) => part.trim());
    const tsPart = parts.find((part) => part.startsWith('ts='));
    const v1Part = parts.find((part) => part.startsWith('v1='));

    if (!tsPart || !v1Part) {
      return false;
    }

    const ts = tsPart.replace('ts=', '');
    const expectedSignature = v1Part.replace('v1=', '');

    const payload = `${ts}.${requestId}.${notifId}`;
    const computed = createHmac('sha256', secret).update(payload).digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const computedBuffer = Buffer.from(computed, 'hex');

    if (expectedBuffer.length !== computedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, computedBuffer);
  }

  @Post('webhook')
  async handleWebhook(
    @Body() body: any,
    @Query('topic') topic: string,
    @Query('id') id: string,
    @Query('tenantId') tenantId: string,
    @Headers('x-signature') signature: string,
    @Headers('x-request-id') requestId: string,
    @Res() res: Response,
  ) {
    // MercadoPago expects a 200 OK quickly, or it will retry
    res.status(HttpStatus.OK).send();

    const notifTopic = topic || body.type;
    const notifId = id || body.data?.id;

    const firmaValida = this.verificarFirmaWebhook(
      signature,
      requestId,
      notifId,
    );

    if (!firmaValida) {
      this.logger.warn('Webhook rechazado por firma invalida');
      return;
    }

    this.logger.log(
      `Received Webhook: Topic=${notifTopic}, ID=${notifId}, TenantID=${tenantId}`,
    );

    try {
      if (notifTopic === 'payment' || notifTopic === 'merchant_order') {
        const paymentId = notifId;
        if (paymentId) {
          void this.paymentsService.processPaymentNotificationWithRetry(
            paymentId,
            tenantId,
          );
        }
      }
    } catch (error) {
      this.logger.error('Error processing webhook', error);
    }
  }
}
