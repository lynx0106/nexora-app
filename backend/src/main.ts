import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { getCorsOrigins, getJwtSecret } from './config/runtime.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Valida configuracion critica al inicio.
  getJwtSecret();

  const corsOrigins = getCorsOrigins();

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  const port = Number(process.env.PORT) || 4001;
  await app.listen(port);
}
void bootstrap();
