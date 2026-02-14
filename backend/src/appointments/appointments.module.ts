import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { Appointment } from './entities/appointment.entity';
import { AppointmentsScheduler } from './appointments.scheduler';
import { MailModule } from '../mail/mail.module';
import { UsersModule } from '../users/users.module';
import { TenantsModule } from '../tenants/tenants.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ProductsModule } from '../products/products.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment]),
    MailModule,
    UsersModule,
    TenantsModule,
    NotificationsModule,
    ProductsModule,
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsScheduler],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
