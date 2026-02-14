import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { OrdersModule } from '../orders/orders.module';
import { AppointmentsModule } from '../appointments/appointments.module';

@Module({
  imports: [OrdersModule, AppointmentsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
