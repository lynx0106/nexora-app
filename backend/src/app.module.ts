import { Module, Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { getDatabaseConfig, logDatabaseConfig } from './config/database.config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TenantsModule } from './tenants/tenants.module';
import { ProductsModule } from './products/products.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { UploadsModule } from './uploads/uploads.module';
import { PublicModule } from './public/public.module';
import { OrdersModule } from './orders/orders.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { MailModule } from './mail/mail.module';
import { ChatModule } from './chat/chat.module';
import { PaymentsModule } from './payments/payments.module';
import { AiModule } from './ai/ai.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';
import { ReportsModule } from './reports/reports.module';
import { InvitationsModule } from './invitations/invitations.module';
import { InventoryModule } from './inventory/inventory.module';
import { PushModule } from './push/push.module';
import { TasksModule } from './tasks/tasks.module';
import { AutomationsModule } from './automations/automations.module';
import { PlansModule } from './plans/plans.module';
import { AuditInterceptor } from './audit/audit.interceptor';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot({
      throttlers: [
        {
          // Rate limiting: 100 requests per 60 seconds by default
          // Production recommendation: 100-200 requests per minute
          ttl: Number(process.env.RATE_LIMIT_TTL || 60),
          limit: Number(process.env.RATE_LIMIT_LIMIT || 100),
        },
      ],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        logDatabaseConfig();
        const config = getDatabaseConfig();
        // En producción: synchronize=false por defecto. En desarrollo: true si no se especifica.
        const explicitSync = process.env.TYPEORM_SYNCHRONIZE;
        const shouldSync =
          process.env.NODE_ENV === 'production'
            ? explicitSync === 'true'
            : explicitSync !== 'false';
        if (shouldSync && process.env.NODE_ENV === 'production') {
          Logger.warn(
            'TYPEORM_SYNCHRONIZE=true en producción - riesgo de pérdida de datos',
            'AppModule',
          );
        }
        return {
          ...config,
          autoLoadEntities: true,
          synchronize: shouldSync,
        };
      },
    }),
    UsersModule,
    AuthModule,
    TenantsModule,
    ProductsModule,
    AppointmentsModule,
    UploadsModule,
    PublicModule,
    OrdersModule,
    DashboardModule,
    MailModule,
    ChatModule,
    PaymentsModule,
    AiModule,
    NotificationsModule,
    AuditModule,
    ReportsModule,
    InvitationsModule,
    InventoryModule,
    PushModule,
    TasksModule,
    AutomationsModule,
    PlansModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
