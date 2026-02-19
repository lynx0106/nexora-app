import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { getCorsOrigins, getJwtSecret } from './config/runtime.config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { initSentry } from './config/sentry.config';

// Initialize Sentry before bootstrap
initSentry();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('HTTP');
  // Valida configuracion critica al inicio.
  getJwtSecret();

  const corsOrigins = getCorsOrigins();

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Headers de seguridad basicos.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          imgSrc: ["'self'", 'data:'],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          connectSrc: ["'self'"],
        },
      },
      crossOriginResourcePolicy: { policy: 'same-site' },
    }),
  );

  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = randomUUID();
    res.setHeader('x-request-id', requestId);
    req.headers['x-request-id'] = requestId;
    const start = Date.now();

    res.on('finish', () => {
      const durationMs = Date.now() - start;
      const user = (req as any).user;

      const payload = {
        requestId,
        method: req.method,
        path: req.originalUrl || req.url,
        statusCode: res.statusCode,
        durationMs,
        tenantId: user?.tenantId,
        userId: user?.userId,
      };

      logger.log(JSON.stringify(payload));
    });

    next();
  });

  app.useGlobalFilters(new HttpExceptionFilter());

  // Validacion global de DTOs.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT) || 4001;

  // Configuracion de Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('Nexora App API')
    .setDescription('API Documentation for Nexora SaaS Multi-tenant Platform')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth')
    .addTag('Users')
    .addTag('Tenants')
    .addTag('Products')
    .addTag('Orders')
    .addTag('Appointments')
    .addTag('Dashboard')
    .addTag('AI')
    .addTag('Public')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
}
void bootstrap();
