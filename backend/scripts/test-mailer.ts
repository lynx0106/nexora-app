import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { MailService } from '../src/mail/mail.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const mailService = app.get(MailService);

  // Simulación de envío de correo de invitación
  await mailService.sendInvitation({
    email: process.env.TEST_EMAIL || 'test@example.com',
    token: 'simulated-token-123',
    tenantName: 'Empresa Demo',
    role: 'admin',
    inviterName: 'Admin Demo',
  });

  // Simulación de envío de correo de reset de contraseña
  await mailService.sendPasswordReset({
    email: process.env.TEST_EMAIL || 'test@example.com',
    firstName: 'Usuario Demo',
    token: 'reset-token-456',
  });

  await app.close();
}

bootstrap();
