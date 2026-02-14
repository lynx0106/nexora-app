# Cómo obtener DATABASE_URL en Supabase

## Paso 1: Entrar a Supabase
1. Ve a https://app.supabase.com
2. Abre tu proyecto (o crea uno si no lo has hecho).

## Paso 2: Obtener la cadena de conexión PostgreSQL

**Opción A: Connection Pooling (recomendado para migraciones)**

1. En el panel de Supabase, ve a **Settings** (engranaje abajo a la izquierda).
2. Dentro de Settings, abre la pestaña **Database**.
3. Desplázate hacia abajo hasta encontrar la sección **Connection pooling** (o **Pooler**).
4. En esa sección verás varias pestañas:
   - Session mode
   - Transaction mode
5. Haz clic en **Transaction mode** (recomendado para conexiones de corta duración como migraciones).
6. Copia la cadena que empieza con `postgresql://` o `postgres://`
   - Aspecto: `postgres://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`
7. **Esa cadena es tu DATABASE_URL**.

**Opción B: Direct Connection (si no quieres pooling)**

1. En **Settings → Database**, busca la sección **Connection Info** o **Direct Connection**.
2. Copia la cadena que comienza con `postgresql://` o `postgres://`
   - Aspecto: `postgres://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres`
3. **Esa es tu DATABASE_URL sin pooler**.

**Diferencia:**
- Connection Pooling (Pooler): más rápido para muchas conexiones cortas (migraciones, webhooks, CI/CD).
- Direct Connection: para aplicaciones que mantienen conexión persistente.

## Paso 3: Verificar que la cadena es correcta

Comprueba que tu cadena tenga este formato:
```
postgresql://username:password@host:port/database
```

Donde:
- `username` = normalmente `postgres`
- `password` = la contraseña que estableciste al crear el proyecto
- `host` = puede ser `.pooler.supabase.com` (pooling) o `.supabase.co` (directo)
- `port` = 6543 (pooler) o 5432 (directo)
- `database` = normalmente `postgres`

## Paso 4: Otros valores necesarios

Mientras estés en Supabase, también copia:

- **SUPABASE_URL**: Ve a **Settings → API** y copia la URL que comienza con `https://`
- **SUPABASE_ANON_KEY**: En **Settings → API**, busca "anon" key (pública, segura para frontend).
- **SUPABASE_SERVICE_ROLE_KEY**: En **Settings → API**, busca "service_role" key (privada, sólo backend/GitHub Actions).

Ejemplo:
```
SUPABASE_URL = https://your-project.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_DATABASE_URL = postgresql://postgres:your-password@...pooler.supabase.com:6543/postgres
```

## Paso 5: Añadir a GitHub Secrets

Una vez tengas tu `SUPABASE_DATABASE_URL`:
1. Ve a tu repo en GitHub → Settings → Secrets and variables → Actions.
2. Haz clic en "New repository secret".
3. Name: `SUPABASE_DATABASE_URL`
4. Value: (pega tu cadena postgresql://...)
5. Add secret.

¡Listo! El workflow de migraciones ya podrá conectarse a tu base de datos.
