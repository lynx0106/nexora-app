# Checklist de mejoras y hardening

Esta lista esta priorizada para estabilidad, seguridad y mantenibilidad a largo plazo.

## P0 - Seguridad e integridad de datos
1) ✅ Desactivar TypeORM auto-sync en produccion.
   - Usar TYPEORM_SYNCHRONIZE=false en prod.
   - Agregar flujo de migraciones.
2) ✅ Proteger endpoints de seed.
   - Requiere AuthGuard + rol superadmin.
   - Controlado con ALLOW_PRODUCT_SEED=true.
3) ✅ Validar precios de pedidos en servidor.
   - Recalcular precio desde Product.
   - Ignorar precio y total enviados por cliente.
4) ✅ Enforzar JWT_SECRET en prod.
   - Falla rapido si JWT_SECRET no esta configurado.
5) ✅ Restringir CORS en WebSocket.
   - CORS_ORIGINS o FRONTEND_URL.

## P1 - Estabilidad y calidad de datos
6) ✅ Agregar validacion de entrada en controllers (DTO + class-validator).
7) ✅ Definir enums de rol y checks consistentes.
8) ✅ Restringir creacion automatica de tenant en getOrCreateTenant.
9) ✅ Agregar rate limiting para auth y endpoints publicos.
10) ✅ Mejorar seguridad transaccional en stock y reembolsos.

## P1 - Observabilidad
11) ✅ Logging estructurado (request id, tenant id).
12) ✅ Tracking de errores (webhook opcional).
13) ✅ Endpoint de health check.

## P2 - Endpoints publicos
14) ✅ Agregar verificacion de email o reset de password para usuarios publicos.
15) ✅ Agregar token de verificacion para estado de pedidos publicos.
16) ✅ Agregar captcha o anti-bot para reservas y pedidos publicos.

## P2 - Pagos
17) Guardar metadata de MercadoPago de forma segura (sin logs de secretos).
18) ✅ Verificar firma de webhooks.
19) ✅ Agregar cola de reintentos para fallos en webhooks.

## P2 - Datos y esquema
20) ✅ Agregar migraciones y tracking de historial.
   - Scripts y DataSource para CLI de migraciones.
21) ✅ Agregar indices en consultas frecuentes (tenantId, createdAt, status).
22) ✅ Agregar constraints para FK tenantId y valores de roles.
   - Se agregaron como NOT VALID para no romper datos existentes; validar en staging/produccion.

## P2 - UX Frontend
23) ✅ Agregar error boundary y manejo central de toasts.
24) ✅ Mejorar estados vacios para chat, pedidos y agenda.
25) ✅ Agregar loaders y skeletons.

## P2 - Headers de seguridad
26) ✅ Agregar CORS estricto y headers de seguridad en backend.
27) ✅ Configurar helmet con CSP.

## P3 - Mejoras de producto
28) ✅ Flujo unificado de invitaciones con magic links.
29) ✅ Exportar reportes (pedidos, citas, usuarios).
30) Agregar RBAC avanzado (permisos granulares).

## P3 - Infra y ops
31) ✅ Agregar politica de backups y pruebas de restauracion.
32) ✅ Agregar entorno staging y checks de despliegue.
33) ✅ Agregar tests automatizados para flujos criticos.
34) Pendiente: actualizar @nestjs-modules/mailer (rompe compatibilidad) y validar envio de emails en staging.

## Alcance de redisenio UI
- Actualizar tokens de diseno (colores, tipografia, spacing).
- Crear sistema de componentes unificado (botones, tarjetas, formularios).
- Redisenar dashboard y flujo publico de reservas.
- Agregar iconografia consistente y estilos de data viz.

