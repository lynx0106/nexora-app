# 🗺️ Plan de Tareas para Producción — Nexora-App

**Fecha:** 16 de febrero de 2026  
**Objetivo:** Llevar Nexora-App de su estado actual (3.2/10) a un estado apto para producción (≥7/10)  
**Tiempo estimado total:** 3-4 semanas (trabajando 1 desarrollador full-time)

---

## 📋 ETAPA 1: EMERGENCIA DE SEGURIDAD (Días 1-3)
> **Prioridad:** 🔴 BLOQUEANTE — Sin esto, el proyecto es vulnerable a ataques inmediatos

### Tarea 1.1 — Eliminar credenciales expuestas del repositorio
- **Archivo:** `RESUMEN_PROYECTO.md`
- **Acción:** 
  - Eliminar TODAS las contraseñas, DATABASE_URL, y keys del archivo
  - Reemplazar con placeholders: `[VER SECRETS EN GITHUB/RAILWAY]`
  - Ejecutar `git filter-branch` o usar BFG Repo-Cleaner para eliminar credenciales del historial de Git
- **Post-acción:** 
  - Rotar la contraseña de Supabase desde el panel
  - Regenerar `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`
  - Actualizar secrets en GitHub, Vercel y Railway
- **Criterio de éxito:** `git log --all -p | grep "Oriana2024"` no devuelve resultados
- **Tiempo estimado:** 2-3 horas

### Tarea 1.2 — Corregir CORS y puerto dinámico en main.ts
- **Archivo:** `backend/src/main.ts`
- **Acción:**
  ```typescript
  async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    
    const allowedOrigins = [
      process.env.FRONTEND_URL || 'https://nexora-app.online',
      'http://localhost:3002', // Solo para desarrollo
    ].filter(Boolean);
    
    app.enableCors({
      origin: allowedOrigins,
      credentials: true,
    });
    
    const port = process.env.PORT || 4001;
    await app.listen(port, '0.0.0.0');
    console.log(`Server running on port ${port}`);
  }
  ```
- **Variables de entorno a agregar en Railway:**
  - `FRONTEND_URL=https://nexora-app.online`
  - `PORT` (Railway lo asigna automáticamente)
- **Criterio de éxito:** Frontend en Vercel puede hacer peticiones al backend en Railway sin errores CORS
- **Tiempo estimado:** 30 minutos

### Tarea 1.3 — Desactivar synchronize en producción
- **Archivo:** `backend/src/app.module.ts`
- **Acción:**
  ```typescript
  TypeOrmModule.forRoot({
    type: 'postgres',
    url: process.env.DATABASE_URL, // Usar URL completa
    host: process.env.DATABASE_URL ? undefined : (process.env.POSTGRES_HOST || 'localhost'),
    port: process.env.DATABASE_URL ? undefined : (parseInt(process.env.POSTGRES_PORT || '5432')),
    username: process.env.DATABASE_URL ? undefined : (process.env.POSTGRES_USER || 'postgres'),
    password: process.env.DATABASE_URL ? undefined : (process.env.POSTGRES_PASSWORD || ''),
    database: process.env.DATABASE_URL ? undefined : (process.env.POSTGRES_DB || 'postgres'),
    autoLoadEntities: true,
    synchronize: process.env.NODE_ENV !== 'production', // NUNCA true en producción
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  }),
  ```
- **Criterio de éxito:** En Railway con `NODE_ENV=production`, synchronize es `false`
- **Tiempo estimado:** 30 minutos

### Tarea 1.4 — Proteger endpoint de registro
- **Archivo:** `backend/src/auth/auth.service.ts`
- **Acción:**
  - En el método `register()`, forzar que el rol sea `'user'` o `'client'` si no viene de un admin autenticado
  - Crear un endpoint separado `POST /users/create` protegido con JWT + rol admin para crear usuarios con roles elevados
  ```typescript
  async register(data: RegisterDto) {
    // NUNCA permitir registro público como superadmin o admin
    const safeRole = ['user', 'client', 'employee'].includes(data.role) ? data.role : 'user';
    // ... resto del código con safeRole en vez de data.role
  }
  ```
- **Criterio de éxito:** `POST /auth/register` con `role: 'superadmin'` crea usuario con rol `user`
- **Tiempo estimado:** 1 hora

### Tarea 1.5 — Asegurar JWT Secret
- **Archivos:** `backend/src/auth/jwt.strategy.ts`, `backend/src/chat/chat.gateway.ts`
- **Acción:**
  - Eliminar fallback `'change-me'`
  - Lanzar error si `JWT_SECRET` no está configurado
  ```typescript
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
  }
  secretOrKey: jwtSecret,
  ```
- **Variable de entorno a agregar en Railway:**
  - `JWT_SECRET` = generar con `openssl rand -hex 32`
- **Criterio de éxito:** App no arranca sin JWT_SECRET configurado
- **Tiempo estimado:** 30 minutos

### Tarea 1.6 — Restringir CORS del WebSocket
- **Archivo:** `backend/src/chat/chat.gateway.ts`
- **Acción:**
  ```typescript
  @WebSocketGateway({
    cors: {
      origin: [
        process.env.FRONTEND_URL || 'https://nexora-app.online',
        'http://localhost:3002',
      ],
      credentials: true,
    },
  })
  ```
- **Criterio de éxito:** Conexiones WebSocket desde dominios no autorizados son rechazadas
- **Tiempo estimado:** 15 minutos

---

## 📋 ETAPA 2: VALIDACIÓN Y ROBUSTEZ (Días 4-7)
> **Prioridad:** 🟠 ALTA — Previene inyección de datos y errores en runtime

### Tarea 2.1 — Instalar y configurar class-validator
- **Acción:**
  ```bash
  cd backend && npm install class-validator class-transformer
  ```
- **Archivo:** `backend/src/main.ts`
  ```typescript
  import { ValidationPipe } from '@nestjs/common';
  // Dentro de bootstrap():
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,        // Elimina propiedades no declaradas en el DTO
    forbidNonWhitelisted: true, // Lanza error si envían propiedades extra
    transform: true,        // Transforma tipos automáticamente
  }));
  ```
- **Tiempo estimado:** 30 minutos

### Tarea 2.2 — Agregar validaciones a todos los DTOs
- **Archivos a modificar:**
  - `backend/src/auth/dto/register.dto.ts`
  - `backend/src/auth/dto/login.dto.ts`
  - `backend/src/appointments/dto/create-appointment.dto.ts`
  - Crear DTOs faltantes para: orders, products, tenants, chat
- **Ejemplo para RegisterDto:**
  ```typescript
  import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsString } from 'class-validator';
  
  export class RegisterDto {
    @IsString() @IsNotEmpty() firstName: string;
    @IsString() @IsNotEmpty() lastName: string;
    @IsEmail() email: string;
    @IsOptional() @IsString() phone?: string;
    @IsOptional() @IsString() address?: string;
    @MinLength(8) password: string;
    @IsString() @IsNotEmpty() tenantId: string;
    @IsOptional() @IsString() role?: string;
  }
  ```
- **Criterio de éxito:** Enviar JSON con email inválido a `/auth/register` devuelve 400 con mensaje descriptivo
- **Tiempo estimado:** 4-5 horas

### Tarea 2.3 — Reemplazar `@Body() body: any` por DTOs tipados
- **Archivos afectados:**
  - `backend/src/public/public.controller.ts` (líneas 37, 42)
  - `backend/src/products/products.controller.ts` (línea 32)
  - Cualquier otro controller que use `any`
- **Acción:** Crear DTOs específicos con validaciones para cada endpoint
- **Tiempo estimado:** 3-4 horas

### Tarea 2.4 — Implementar rate limiting
- **Acción:**
  ```bash
  cd backend && npm install @nestjs/throttler
  ```
- **Archivo:** `backend/src/app.module.ts`
  ```typescript
  import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
  // En imports:
  ThrottlerModule.forRoot([{
    ttl: 60000,    // 1 minuto
    limit: 30,     // 30 peticiones por minuto (general)
  }]),
  // En providers:
  { provide: APP_GUARD, useClass: ThrottlerGuard },
  ```
- **Archivo:** `backend/src/auth/auth.controller.ts` — Rate limit más estricto para login:
  ```typescript
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 intentos por minuto
  @Post('login')
  ```
- **Criterio de éxito:** 6to intento de login en 1 minuto devuelve 429 Too Many Requests
- **Tiempo estimado:** 1-2 horas

### Tarea 2.5 — Eliminar console.logs sensibles
- **Archivos afectados:**
  - `backend/src/auth/auth.service.ts` (línea 40-42) — eliminar log de hash
  - `backend/src/auth/jwt.strategy.ts` (líneas 22, 25, 36) — eliminar logs de auth
  - `backend/src/chat/chat.gateway.ts` (línea 50) — eliminar log de payload
  - `backend/src/users/users.controller.ts` (líneas 64, 72) — eliminar logs de debug
- **Acción:** Reemplazar con `Logger` de NestJS con niveles apropiados, o eliminar
- **Tiempo estimado:** 1 hora

---

## 📋 ETAPA 3: INFRAESTRUCTURA Y DESPLIEGUE (Días 8-12)
> **Prioridad:** 🟠 ALTA — Necesario para que la app funcione correctamente en producción

### Tarea 3.1 — Crear sistema de migraciones con TypeORM
- **Acción:**
  ```bash
  cd backend
  # Agregar scripts en package.json:
  # "migration:generate": "typeorm migration:generate -d src/data-source.ts",
  # "migration:run": "typeorm migration:run -d src/data-source.ts",
  # "migration:revert": "typeorm migration:revert -d src/data-source.ts"
  ```
- **Crear archivo:** `backend/src/data-source.ts` (configuración de TypeORM CLI)
- **Generar migración inicial** desde el esquema actual
- **Actualizar** GitHub Actions workflow para ejecutar migraciones de TypeORM
- **Criterio de éxito:** `npm run migration:run` aplica cambios de esquema de forma controlada
- **Tiempo estimado:** 4-5 horas

### Tarea 3.2 — Agregar health check endpoint
- **Acción:**
  ```bash
  cd backend && npm install @nestjs/terminus
  ```
- **Crear:** `backend/src/health/health.controller.ts`
  ```typescript
  @Controller('health')
  export class HealthController {
    constructor(private health: HealthCheckService, private db: TypeOrmHealthIndicator) {}
    
    @Get()
    check() {
      return this.health.check([
        () => this.db.pingCheck('database'),
      ]);
    }
  }
  ```
- **Configurar en Railway:** Health check path = `/health`
- **Tiempo estimado:** 1 hora

### Tarea 3.3 — Configurar variables de entorno correctamente
- **Crear archivo:** `backend/.env.example` (actualizado)
  ```env
  # === REQUERIDAS ===
  NODE_ENV=development
  PORT=4001
  DATABASE_URL=postgresql://user:pass@localhost:5432/nexora
  JWT_SECRET=genera-un-secret-seguro-aqui
  FRONTEND_URL=http://localhost:3002
  
  # === OPCIONALES ===
  OPENAI_API_KEY=sk-...
  MP_ACCESS_TOKEN=TEST-...
  MAIL_HOST=smtp.gmail.com
  MAIL_PORT=587
  MAIL_USER=
  MAIL_PASS=
  ```
- **Variables a configurar en Railway:**
  | Variable | Valor |
  |----------|-------|
  | `NODE_ENV` | `production` |
  | `DATABASE_URL` | (nueva URL de Supabase con password rotado) |
  | `JWT_SECRET` | (generado con openssl) |
  | `FRONTEND_URL` | `https://nexora-app.online` |
  | `OPENAI_API_KEY` | (si aplica) |
  | `MP_ACCESS_TOKEN` | (si aplica) |

- **Variables a configurar en Vercel:**
  | Variable | Valor |
  |----------|-------|
  | `NEXT_PUBLIC_API_URL` | `https://[tu-app].railway.app` |

- **Tiempo estimado:** 1 hora

### Tarea 3.4 — Configurar SSL para conexión a Supabase
- **Archivo:** `backend/src/app.module.ts`
- **Acción:** Agregar `ssl: { rejectUnauthorized: false }` cuando `NODE_ENV=production` (ya incluido en Tarea 1.3)
- **Tiempo estimado:** 15 minutos

### Tarea 3.5 — Limpiar archivos innecesarios del repositorio
- **Eliminar de la raíz:**
  - `Logo Agencia V5.png`, `logo nexora sinfondo 2.png`, `logo nexora sinfondo iuminado.png`, `logo nexora-fondo.png`, `logo-nexora sin fondo 1.png` → Mover a un servicio de almacenamiento (Supabase Storage o S3)
  - `start-invisible.vbs`, `stop-app.bat` → Solo para desarrollo local, no pertenecen al repo
  - `docker-compose.yml` → Evaluar si se usa, si no, eliminar
- **Eliminar del backend:**
  - `backend/backend/` y `backend/frontend/` (directorios residuales vacíos)
  - `backend/cleanup-plan.ts`, `backend/delete-ghost-tenant.ts`, `backend/list-tenants.ts` (scripts sueltos)
  - `backend/simulate-chat-flow.ts`, `backend/simulate-real-chats.ts` (scripts de simulación)
- **Actualizar `.gitignore`** para prevenir que vuelvan a entrar
- **Tiempo estimado:** 1 hora

### Tarea 3.6 — Eliminar frontend/.env del repositorio
- **Acción:**
  ```bash
  git rm --cached frontend/.env
  echo "frontend/.env" >> .gitignore
  ```
- **Tiempo estimado:** 10 minutos

---

## 📋 ETAPA 4: INTEGRIDAD DE DATOS (Días 13-16)
> **Prioridad:** 🟡 MEDIA-ALTA — Previene inconsistencias y pérdida de datos

### Tarea 4.1 — Agregar Foreign Keys y relaciones TypeORM
- **Archivos a modificar:**
  - `backend/src/users/entities/user.entity.ts` — Agregar `@ManyToOne(() => Tenant)` y `@JoinColumn()`
  - `backend/src/orders/entities/order.entity.ts` — FK a tenant y user
  - `backend/src/products/entities/product.entity.ts` — FK a tenant
  - `backend/src/appointments/entities/appointment.entity.ts` — FK a tenant y user
  - `backend/src/chat/entities/message.entity.ts` — FK a tenant y user
  - `backend/src/notifications/entities/notification.entity.ts` — FK a tenant y user
- **Acción:** Definir relaciones con `@ManyToOne`, `@OneToMany`, `@JoinColumn` y generar migración
- **Criterio de éxito:** No se puede crear un user con un `tenantId` que no existe en la tabla `tenants`
- **Tiempo estimado:** 4-5 horas

### Tarea 4.2 — Cifrar tokens sensibles en la BD
- **Acción:**
  - Instalar: `npm install crypto` (built-in de Node)
  - Crear un servicio `EncryptionService` que use AES-256-GCM
  - Aplicar cifrado a: `mercadoPagoAccessToken`, `openaiApiKey`, `mercadoPagoPublicKey` en la entidad Tenant
  - Usar `@BeforeInsert()` y `@BeforeUpdate()` para cifrar, y un getter para descifrar
- **Variable de entorno nueva:** `ENCRYPTION_KEY` (32 bytes hex)
- **Tiempo estimado:** 3-4 horas

### Tarea 4.3 — Agregar soft delete a entidades críticas
- **Archivos:** User, Tenant, Order, Product
- **Acción:** Agregar `@DeleteDateColumn()` y usar `softDelete()` en vez de `delete()`
- **Tiempo estimado:** 2 horas

---

## 📋 ETAPA 5: TESTING (Días 17-21)
> **Prioridad:** 🟡 MEDIA — Necesario para confianza en producción

### Tarea 5.1 — Tests unitarios para AuthService
- **Archivo:** `backend/src/auth/auth.service.spec.ts`
- **Tests a crear:**
  - ✅ Login exitoso con credenciales válidas
  - ✅ Login falla con email inexistente
  - ✅ Login falla con password incorrecto
  - ✅ Registro exitoso
  - ✅ Registro falla con email duplicado
  - ✅ Registro no permite rol superadmin
- **Tiempo estimado:** 3 horas

### Tarea 5.2 — Tests unitarios para OrdersService
- **Archivo:** `backend/src/orders/orders.service.spec.ts`
- **Tests a crear:**
  - ✅ Crear orden reduce stock correctamente
  - ✅ Crear orden falla si stock insuficiente
  - ✅ Crear orden calcula total correctamente
  - ✅ Cancelar orden restaura stock
- **Tiempo estimado:** 3 horas

### Tarea 5.3 — Tests unitarios para TenantsService
- **Archivo:** `backend/src/tenants/tenants.service.spec.ts`
- **Tests a crear:**
  - ✅ Crear tenant con admin
  - ✅ No permite tenant duplicado
  - ✅ Actualizar perfil de tenant
  - ✅ Solo admin/superadmin puede modificar tenant
- **Tiempo estimado:** 2 horas

### Tarea 5.4 — Tests e2e para flujos críticos
- **Archivo:** `backend/test/auth.e2e-spec.ts`
- **Flujos a probar:**
  - ✅ Registro → Login → Acceso a dashboard
  - ✅ Crear tenant → Crear producto → Crear orden pública
  - ✅ Intento de acceso sin token → 401
  - ✅ Rate limiting funciona
- **Tiempo estimado:** 4 horas

### Tarea 5.5 — Configurar cobertura mínima
- **Archivo:** `backend/package.json`
- **Acción:** Agregar threshold de cobertura en jest config:
  ```json
  "coverageThreshold": {
    "global": {
      "branches": 50,
      "functions": 50,
      "lines": 60,
      "statements": 60
    }
  }
  ```
- **Tiempo estimado:** 15 minutos

---

## 📋 ETAPA 6: OPTIMIZACIÓN Y MONITOREO (Días 22-25)
> **Prioridad:** 🟢 MEDIA — Mejora la experiencia y facilita el mantenimiento

### Tarea 6.1 — Implementar logging estructurado
- **Acción:**
  ```bash
  cd backend && npm install nest-winston winston
  ```
- Configurar Winston con formato JSON para producción
- Reemplazar todos los `console.log` por `this.logger.log()`, `this.logger.warn()`, `this.logger.error()`
- **Tiempo estimado:** 2-3 horas

### Tarea 6.2 — Agregar Helmet para headers de seguridad
- **Acción:**
  ```bash
  cd backend && npm install helmet
  ```
- **Archivo:** `backend/src/main.ts`
  ```typescript
  import helmet from 'helmet';
  app.use(helmet());
  ```
- **Tiempo estimado:** 15 minutos

### Tarea 6.3 — Configurar compresión de respuestas
- **Acción:**
  ```bash
  cd backend && npm install compression @types/compression
  ```
- **Archivo:** `backend/src/main.ts`
  ```typescript
  import compression from 'compression';
  app.use(compression());
  ```
- **Tiempo estimado:** 15 minutos

### Tarea 6.4 — Agregar Swagger/OpenAPI para documentación de API
- **Acción:**
  ```bash
  cd backend && npm install @nestjs/swagger
  ```
- Configurar en `main.ts` y agregar decoradores `@ApiTags`, `@ApiOperation`, `@ApiResponse` a los controllers principales
- **Criterio de éxito:** `/api/docs` muestra documentación interactiva de la API
- **Tiempo estimado:** 3-4 horas

### Tarea 6.5 — Configurar error tracking (Sentry)
- **Acción:**
  ```bash
  cd backend && npm install @sentry/nestjs
  cd ../frontend && npm install @sentry/nextjs
  ```
- Configurar DSN en variables de entorno
- **Tiempo estimado:** 2 horas

---

## 📋 ETAPA 7: VERIFICACIÓN FINAL Y LANZAMIENTO (Días 26-28)
> **Prioridad:** 🟢 FINAL — Checklist pre-producción

### Tarea 7.1 — Checklist de seguridad final
- [ ] No hay credenciales en el código fuente ni en el historial de Git
- [ ] JWT_SECRET es fuerte (≥32 caracteres aleatorios)
- [ ] CORS configurado solo para dominios autorizados
- [ ] Rate limiting activo en todos los endpoints
- [ ] Validación de entrada en todos los endpoints
- [ ] Roles protegidos (no se puede auto-asignar superadmin)
- [ ] Headers de seguridad (Helmet) activos
- [ ] SSL/TLS en todas las conexiones

### Tarea 7.2 — Checklist de infraestructura
- [ ] `NODE_ENV=production` en Railway
- [ ] `synchronize=false` verificado
- [ ] Migraciones ejecutadas correctamente
- [ ] Health check respondiendo en `/health`
- [ ] Frontend conecta correctamente al backend
- [ ] WebSocket funciona (chat en tiempo real)
- [ ] Emails se envían correctamente
- [ ] Pagos con MercadoPago funcionan (sandbox)

### Tarea 7.3 — Pruebas de carga básicas
- **Herramienta:** `artillery` o `k6`
- **Escenarios:**
  - 50 usuarios concurrentes haciendo login
  - 100 peticiones/segundo al catálogo público
  - 20 conexiones WebSocket simultáneas
- **Criterio de éxito:** Tiempo de respuesta p95 < 500ms, 0 errores 5xx
- **Tiempo estimado:** 2-3 horas

### Tarea 7.4 — Deploy final y smoke test
- [ ] Push a `main` con todos los cambios
- [ ] Verificar deploy automático en Railway
- [ ] Verificar deploy automático en Vercel
- [ ] Ejecutar migraciones en producción
- [ ] Probar flujo completo: registro → login → crear producto → crear orden → pago
- [ ] Verificar chat en tiempo real
- [ ] Verificar notificaciones
- **Tiempo estimado:** 2-3 horas

---

## 📊 RESUMEN DE TIEMPOS

| Etapa | Descripción | Días | Horas estimadas |
|-------|-------------|------|-----------------|
| 1 | Emergencia de Seguridad | 1-3 | ~6h |
| 2 | Validación y Robustez | 4-7 | ~12h |
| 3 | Infraestructura y Despliegue | 8-12 | ~9h |
| 4 | Integridad de Datos | 13-16 | ~11h |
| 5 | Testing | 17-21 | ~12h |
| 6 | Optimización y Monitoreo | 22-25 | ~10h |
| 7 | Verificación y Lanzamiento | 26-28 | ~8h |
| **TOTAL** | | **~28 días** | **~68 horas** |

---

## 🎯 HITOS DE CALIFICACIÓN ESPERADA

| Después de Etapa | Calificación esperada | Estado |
|------------------|-----------------------|--------|
| Etapa 1 completada | 4.5/10 | ⚠️ Seguro pero incompleto |
| Etapa 2 completada | 5.5/10 | ⚠️ Robusto pero sin infra |
| Etapa 3 completada | 6.5/10 | 🟡 Funcional en producción |
| Etapa 4 completada | 7.0/10 | 🟢 **MVP listo para producción** |
| Etapa 5 completada | 7.5/10 | 🟢 Producción con confianza |
| Etapa 6 completada | 8.0/10 | 🟢 Producción profesional |
| Etapa 7 completada | 8.5/10 | 🟢 Producción enterprise-ready |

> **Nota:** Las etapas 1-4 son el **mínimo absoluto** para ir a producción. Las etapas 5-7 son altamente recomendadas pero pueden ejecutarse en paralelo con un lanzamiento controlado (beta cerrada).

---

**Documento generado:** 16 de febrero de 2026  
**Próximo paso recomendado:** Comenzar inmediatamente con la Etapa 1, Tarea 1.1 (eliminar credenciales)
