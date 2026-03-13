# Instrucciones de Configuración de Supabase para Nexora

## Resumen del Problema

Railway y Supabase son dos servicios separados con sus propias bases de datos PostgreSQL. Para que la aplicación funcione, necesitamos:

1. **Crear las tablas en Supabase** (usando el SQL proporcionado)
2. **Configurar Railway para que apunte a Supabase**
3. **Crear los usuarios iniciales (superadmin, demo)**

---

## Paso 1: Crear Tablas en Supabase

### Opción A: Usando el SQL Editor (Recomendado)

1. Ve a [Supabase Dashboard](https://app.supabase.com)
2. Selecciona tu proyecto
3. Ve a **SQL Editor** (en el menú lateral)
4. Crea una **New Query**
5. Copia y pega el contenido de `backend/scripts/init-database.sql`
6. Haz clic en **Run**

### Opción B: Mediante API (después del deploy)

Una vez que el backend esté deployado en Railway, puedes ejecutar:

```bash
# Verificar estado de la base de datos
curl https://nexora-app-production-3104.up.railway.app/db-init/status

# Crear tablas y usuarios
curl -X POST https://nexora-app-production-3104.up.railway.app/db-init/setup
```

---

## Paso 2: Configurar Variables de Entorno en Railway

1. Ve a [Railway Dashboard](https://railway.app)
2. Selecciona tu proyecto
3. Ve a la pestaña **Variables**
4. Agrega/Actualiza las siguientes variables:

### Variable Obligatoria
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Cómo obtener la URL:**
1. En Supabase Dashboard → Project Settings → Database
2. Copia la "Connection string" (URI format)
3. Reemplaza `[PASSWORD]` con tu contraseña de PostgreSQL

### Variables Opcionales pero Recomendadas
```
SUPABASE_URL=https://[PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SUPABASE_SERVICE_ROLE_KEY=service_role_key_here
JWT_SECRET=tu_secreto_jwt_seguro
```

---

## Paso 3: Crear Usuarios Iniciales

### Opción A: Automática (usando endpoint)

Después del deploy:

```bash
# Crear superadmin
curl -X POST https://nexora-app-production-3104.up.railway.app/db-init/create-superadmin

# Crear usuarios demo
curl -X POST https://nexora-app-production-3104.up.railway.app/db-init/create-demo-users

# O todo en uno:
curl -X POST https://nexora-app-production-3104.up.railway.app/db-init/setup
```

### Opción B: Manual (usando SQL)

En Supabase SQL Editor:

```sql
-- Crear superadmin
INSERT INTO users (id, email, "passwordHash", "firstName", "lastName", role, "tenantId", "isActive")
VALUES (
  uuid_generate_v4(),
  'superadmin@saas.com',
  '$2b$10$YourHashedPasswordHere', -- Usa bcrypt para hashear 'NexoraTemp2026!'
  'Super',
  'Admin',
  'superadmin',
  'system',
  true
);
```

---

## Credenciales por Defecto

Una vez configurado:

| Usuario | Email | Contraseña | Rol |
|---------|-------|------------|-----|
| Superadmin | superadmin@saas.com | NexoraTemp2026! | superadmin |
| Demo Admin | carlos.demo@miempresa.com | Demo2026! | admin |
| Demo User | luis.demo@miempresa.com | Demo2026! | user |
| Clínica Admin | ana.demo@clinica.com | Demo2026! | admin |
| Clínica User | pedro.demo@clinica.com | Demo2026! | user |

⚠️ **IMPORTANTE:** Cambia la contraseña del superadmin inmediatamente después del primer login.

---

## Verificación

Para verificar que todo funciona:

1. **Verificar tablas en Supabase:**
   - Dashboard → Table Editor
   - Deberías ver: users, tenants, products, orders, etc.

2. **Verificar conexión:**
   ```bash
   curl https://nexora-app-production-3104.up.railway.app/db-init/status
   ```

3. **Probar login:**
   - Ve a https://www.nexora-app.online
   - Intenta login con superadmin@saas.com / NexoraTemp2026!

---

## Troubleshooting

### Error: "relation 'users' does not exist"
- Las tablas no fueron creadas. Ejecuta el SQL de `init-database.sql` en Supabase.

### Error: "password authentication failed"
- Verifica que `DATABASE_URL` tenga la contraseña correcta
- Asegúrate de que la URL esté completa (incluye `postgresql://`)

### Error: "Connection refused"
- Verifica que el proyecto de Supabase esté activo
- Asegúrate de que no haya restricciones de IP en Supabase (o agrega las IPs de Railway)

### Los usuarios no aparecen
- Ejecuta el endpoint `/db-init/create-superadmin`
- Verifica en Supabase Table Editor que los usuarios existan

---

## Diagrama de Arquitectura

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   Frontend      │      │     Railway      │      │    Supabase     │
│   (Vercel)      │◄────►│   (NestJS API)   │◄────►│  (PostgreSQL)   │
│                 │      │                  │      │                 │
│ www.nexora-app  │      │  DATABASE_URL    │      │  users, orders  │
│    .online      │      │  apunta a        │      │  products, etc  │
└─────────────────┘      │  Supabase        │      └─────────────────┘
                         └──────────────────┘
```

---

## Notas Importantes

1. **No uses la base de datos de Railway** - Siempre usa Supabase como fuente única de verdad
2. **Sincronización automática** - No es necesaria; Railway solo lee/escribe de Supabase
3. **Backups** - Supabase maneja backups automáticos
4. **Seguridad** - Configura RLS (Row Level Security) en Supabase después de la configuración inicial
