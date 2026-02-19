import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { OrdersModule } from '../orders/orders.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { Tenant } from '../tenants/entities/tenant.entity';
import { Order } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { Appointment } from '../appointments/entities/appointment.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [OrdersModule, AppointmentsModule, TypeOrmModule.forFeature([Tenant, Order, Product, Appointment, User])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
