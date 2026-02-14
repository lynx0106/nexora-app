import { Controller, Get, Param, Query, Post, Body } from '@nestjs/common';
import { PublicService } from './public.service';

@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('ping')
  ping() {
    return 'pong';
  }

  @Get('tenant/:tenantId')
  getTenantInfo(@Param('tenantId') tenantId: string) {
    return this.publicService.getTenantInfo(tenantId);
  }

  @Get('services/:tenantId')
  getServices(@Param('tenantId') tenantId: string) {
    return this.publicService.getTenantServices(tenantId);
  }

  @Get('products/:tenantId')
  getProducts(@Param('tenantId') tenantId: string) {
    return this.publicService.getTenantProducts(tenantId);
  }

  @Get('availability/:tenantId')
  getAvailability(
    @Param('tenantId') tenantId: string,
    @Query('date') date: string,
  ) {
    return this.publicService.getAvailability(tenantId, date);
  }

  @Post('book/:tenantId')
  createAppointment(@Param('tenantId') tenantId: string, @Body() body: any) {
    return this.publicService.createAppointment(tenantId, body);
  }

  @Post('order/:tenantId')
  createOrder(@Param('tenantId') tenantId: string, @Body() body: any) {
    return this.publicService.createOrder(tenantId, body);
  }

  @Get('orders/:id')
  getOrderStatus(@Param('id') id: string) {
    return this.publicService.getOrderStatus(id);
  }
}
