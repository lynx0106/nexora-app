import { Module } from '@nestjs/common';
import { PublicService } from './public.service';
import { PublicController } from './public.controller';
import { TenantsModule } from '../tenants/tenants.module';
import { ProductsModule } from '../products/products.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { UsersModule } from '../users/users.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
  imports: [
    TenantsModule,
    ProductsModule,
    AppointmentsModule,
    UsersModule,
    OrdersModule,
  ],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
