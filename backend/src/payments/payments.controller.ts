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
import type { Response } from 'express';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('webhook')
  async handleWebhook(
    @Body() body: any,
    @Query('topic') topic: string,
    @Query('id') id: string,
    @Query('tenantId') tenantId: string,
    @Res() res: Response,
  ) {
    // MercadoPago expects a 200 OK quickly, or it will retry
    res.status(HttpStatus.OK).send();

    const notifTopic = topic || body.type;
    const notifId = id || body.data?.id;

    this.logger.log(
      `Received Webhook: Topic=${notifTopic}, ID=${notifId}, TenantID=${tenantId}`,
    );

    try {
      if (notifTopic === 'payment' || notifTopic === 'merchant_order') {
        const paymentId = notifId;
        if (paymentId) {
          await this.paymentsService.processPaymentNotification(
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
