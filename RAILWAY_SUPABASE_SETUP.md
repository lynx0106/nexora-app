# Configuración de Supabase en Railway

Este documento explica cómo configurar el backend de Nexora para usar **Supabase** como base de datos principal en lugar de PostgreSQL de Railway.

## Problema

Por defecto, Railway crea una base de datos PostgreSQL propia que es diferente de Supabase. Esto causa que:
- Los usuarios creados en Supabase no funcionen en Railway
- Las credenciales no se reconozcan
- Los datos estén desincronizados

## Solución

### Opción 1: Usar Supabase como base de datos principal (Recomendado)

1. **Obtener URL de conexión de Supabase:**
   - Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
   - Ve a "Project Settings" > "Database"
   - Copia la "Connection string" (URI format)

2. **Configurar en Railway:**
   - Ve a tu proyecto en Railway
   - Variables > "Raw Editor"
   - Agrega/Actualiza:
     ```
     DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
     ```
   - O usa la variable específica:
     ```
     SUPABASE_DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
     ```

3. **Redeploy:**
   - Railway automáticamente redeployará con la nueva configuración

### Opción 2: Migrar datos de Railway a Supabase

Si ya tienes datos en Railway y quieres migrarlos a Supabase:

```bash
# En tu máquina local, con ambas URLs configuradas:
export RAILWAY_DATABASE_URL="postgresql://..."  # URL actual de Railway
export SUPABASE_DATABASE_URL="postgresql://..." # URL de Supabase

cd backend
npx ts-node scripts/migrate-to-supabase.ts
```

Después de migrar, actualiza la variable `DATABASE_URL` en Railway para apuntar a Supabase.

### Opción 3: Mantener ambas bases (No recomendado)

Solo para desarrollo/testing. Configura:
- `DATABASE_URL` para Railway PostgreSQL
- `SUPABASE_DATABASE_URL` para Supabase

El backend priorizará `SUPABASE_DATABASE_URL` si está disponible.

## Verificación

Después del deploy, verifica que esté usando Supabase:

```bash
# Ver usuarios en la base de datos actual
curl https://nexora-app-production-3199.up.railway.app/users/public/diagnostic
```

Debería mostrar los mismos usuarios que ves en Supabase Dashboard.

## Credenciales por defecto

Una vez configurado Supabase correctamente, las credenciales serán:

| Usuario | Email | Contraseña |
|---------|-------|------------|
| Superadmin | `superadmin@saas.com` | `NexoraTemp2026!` |
| Demo Admin | `carlos.demo@miempresa.com` | `Demo2026!` |
| Demo User | `luis.demo@miempresa.com` | `Demo2026!` |

## Troubleshooting

### "No se reconocen las credenciales"

1. Verifica que `DATABASE_URL` apunte a Supabase:
   ```bash
   curl https://nexora-app-production-3199.up.railway.app/users/public/diagnostic
   ```

2. Asegúrate de que el superadmin exista:
   ```bash
   curl -X POST https://nexora-app-production-3199.up.railway.app/users/public/seed-superadmin
   ```

3. Verifica en Supabase Dashboard que la tabla `users` tenga datos

### "Cannot connect to database"

- Verifica que la URL de Supabase sea correcta
- Asegúrate de que la contraseña no contenga caracteres especiales sin encode
- Prueba la conexión localmente primero

## Notas de Seguridad

⚠️ **IMPORTANTE:** Después de configurar Supabase:
1. Cambia la contraseña del superadmin inmediatamente
2. Elimina el endpoint `/users/public/seed-superadmin` (es temporal)
3. Configura restricciones de IP en Supabase si es posible

## Sincronización Automática

Para mantener sincronizadas las bases de datos automáticamente, considera:
1. **Usar Supabase como única fuente de verdad** (recomendado)
2. Configurar replicación PostgreSQL (avanzado)
3. Usar scripts de sincronización periódicos

La opción 1 (Supabase único) es la más simple y recomendada para la mayoría de casos.
