import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import helmet from 'helmet';
import { randomUUID } from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { getCorsOrigins, getJwtSecret } from './config/runtime.config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

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

  const port = Number(process.env.PORT) || 4001;
  await app.listen(port);
}
void bootstrap();
