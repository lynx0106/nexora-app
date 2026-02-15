# Politica de backups y pruebas de restauracion

Este documento define el plan de respaldo y restauracion para Nexora (PostgreSQL en Supabase).

## Objetivos
- RPO (perdida maxima de datos): 24h.
- RTO (tiempo maximo de recuperacion): 4h.
- Prioridad: minimizar riesgo operativo y validar restauraciones regularmente.

## Alcance
- Base de datos principal (PostgreSQL Supabase).
- Archivos subidos (bucket de Supabase, si aplica).
- Configuracion critica (variables de entorno, claves, endpoints).

## Politica de backups (DB)
1) Backups automaticos diarios (Supabase).
2) Backup manual semanal (export)
   - Se ejecuta `pg_dump` y se almacena en almacenamiento seguro (S3, GCS o similar).
3) Retencion recomendada:
   - Diarios: 7 dias.
   - Semanales: 4 semanas.
   - Mensuales: 12 meses.
4) Encriptacion en reposo (KMS del proveedor o cifrado antes de subir).
5) Acceso restringido (solo admins autorizados).

## Politica de backups (archivos)
- Exportar buckets criticos (uploads) semanalmente.
- Retencion alineada con DB (7/4/12).

## Proceso de backup manual (DB)
1) Exportar:
```bash
export DATABASE_URL="postgresql://usuario:password@host:5432/postgres"
pg_dump --format=custom --no-owner --no-acl "$DATABASE_URL" > backups/nexora_$(date +%F).dump
```
2) Verificar integridad del archivo:
```bash
pg_restore --list backups/nexora_YYYY-MM-DD.dump | head -n 20
```
3) Subir a almacenamiento seguro.

## Proceso de restauracion (staging primero)
1) Crear base de datos destino (staging) o limpiar esquema.
2) Restaurar:
```bash
export DATABASE_URL="postgresql://usuario:password@host:5432/postgres"
pg_restore --clean --if-exists --no-owner --no-acl --dbname "$DATABASE_URL" backups/nexora_YYYY-MM-DD.dump
```
3) Ejecutar smoke tests:
- Login admin.
- Crear pedido/cita de prueba.
- Verificar reportes basicos.

## Validacion en produccion
- Solo despues de validar en staging.
- Programar ventana de mantenimiento.
- Confirmar backup reciente antes de aplicar.

## Pruebas de restauracion
- Frecuencia: mensual.
- Responsable: equipo tech.
- Checklist:
  - Restauracion exitosa en staging.
  - Verificacion de datos criticos (tenants, users, orders, appointments).
  - Documentar tiempo total y problemas.

## Registro y auditoria
- Guardar reporte de cada prueba de restauracion.
- Anotar fecha, responsable, tiempo total y resultado.

## Notas
- Supabase ofrece backups automaticos. Aun asi, mantener export manual para independencia.
- No compartir credenciales en repositorio.
