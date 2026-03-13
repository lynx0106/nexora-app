/// <reference path="./common/types/express.d.ts" />
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { getCorsOrigins, getJwtSecret } from './config/runtime.config';
import { getDatabaseConfig } from './config/database.config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { initSentry } from './config/sentry.config';

// Initialize Sentry before bootstrap
initSentry();

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  try {
    // Log database info at startup
    const dbConfig = getDatabaseConfig();
    if (dbConfig.url) {
      const maskedUrl = dbConfig.url.replace(
        /:\/\/[^:]+:[^@]+@/,
        '://***:***@',
      );
      logger.log(`Database URL: ${maskedUrl}`);
    } else {
      logger.log(
        `Database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`,
      );
    }

    const app = await NestFactory.create(AppModule);

    // Valida configuracion critica al inicio.
    getJwtSecret();

    const corsOrigins = getCorsOrigins();
    logger.log(`CORS v2 - Origins: ${corsOrigins.join(', ')}`);

    // Enable cookie parsing
    app.use(cookieParser());

    // Handle OPTIONS preflight requests BEFORE CORS setup
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.method === 'OPTIONS') {
        const origin = req.headers.origin;
        if (!origin || corsOrigins.includes(origin)) {
          res.header('Access-Control-Allow-Origin', origin || '*');
          res.header(
            'Access-Control-Allow-Methods',
            'GET,POST,PUT,PATCH,DELETE,OPTIONS',
          );
          res.header(
            'Access-Control-Allow-Headers',
            'Content-Type, Authorization, x-request-id',
          );
          res.header('Access-Control-Allow-Credentials', 'true');
          return res.status(204).send();
        }
      }
      next();
    });

    // CORS configuration - single source of truth
    app.enableCors({
      origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc)
        if (!origin) return callback(null, true);

        // Check if origin is allowed
        if (corsOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
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

        logger.log(
          `[${requestId}] ${req.method} ${req.originalUrl || req.url} ${res.statusCode} - ${durationMs}ms`,
        );
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

    logger.log('Application bootstrap completed - v2026.02.24');

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
    logger.log(`Application listening on port ${port}`);
  } catch (error) {
    logger.error('Fatal error during bootstrap:', error);
    throw error;
  }
}
void bootstrap();
