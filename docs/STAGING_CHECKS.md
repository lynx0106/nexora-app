# Entorno staging y checks de despliegue

Este documento define un entorno de staging y un checklist minimo antes de desplegar a produccion.

## Objetivos
- Reducir riesgos en prod validando cambios en staging.
- Estandarizar checks antes de un release.

## Entorno staging (recomendado)
- Backend: servicio separado (Railway/Render/Fly) apuntando a una base de datos staging.
- Frontend: proyecto/preview separado en Vercel.
- Base de datos: clonar schema + datos anonimizados.

### Variables sugeridas (staging)
- NODE_ENV=staging
- DATABASE_URL=postgresql://... (staging)
- FRONTEND_URL=https://staging.nexora-app.online
- BACKEND_URL=https://api-staging.nexora-app.online
- JWT_SECRET=... (distinto a prod)
- MP_ACCESS_TOKEN=... (credenciales sandbox)
- SMTP_* (cuenta de pruebas)

## Checks de despliegue (antes de prod)
1) Migraciones
- Ejecutar `npm run migration:run` en staging.
- Validar constraints (si aplica).

2) Smoke tests (staging)
- Login admin.
- Crear pedido con pago pendiente.
- Crear cita.
- Consultar dashboard.

3) Webhooks
- Probar webhook de pagos en sandbox.
- Verificar reintentos si falla.

4) Observabilidad
- Revisar logs de errores.
- Confirmar health check OK.

5) Seguridad
- Verificar CORS y headers en staging.
- Confirmar que `JWT_SECRET` esta presente.

6) Rendimiento basico
- Revisar tiempos de respuesta en endpoints clave.

## Release a produccion
- Confirmar backup reciente.
- Ventana de despliegue definida.
- Checklist de rollback listo.

## Checklist de rollback
- Revertir despliegue en backend.
- Revertir frontend (Vercel rollback).
- Restaurar DB desde backup si es necesario.

## Notas
- Mantener data sensible fuera de staging si es posible.
- Documentar hallazgos y tiempos por release.
