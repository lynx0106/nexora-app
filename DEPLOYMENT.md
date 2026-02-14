# Despliegue: Vercel + Supabase

Este documento reúne pasos y comandos para conectar este repositorio con Vercel (hosting del `frontend`) y Supabase (base de datos y auth para el `backend`).

Resumen de flujo recomendado:
- Crear proyecto en Supabase (obtener `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`).
- Crear proyecto en Vercel y apuntarlo a este repositorio (`lynx0106/nexora-app`), configurando la carpeta raíz del frontend como `frontend`.
- Añadir variables de entorno en Vercel (para `frontend` y `backend` si despliegas backend en Vercel o en otro servicio).
- Ejecutar migraciones/seed en Supabase si aplica.

Preparación de variables de entorno (archivo de ejemplo):

```
# supabase.env.example
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
SUPABASE_SERVICE_ROLE_KEY=service_role_key_here
DATABASE_URL=postgresql://user:pass@dbhost:5432/dbname
JWT_SECRET=your_jwt_secret

# Backend-specific (revisar backend/.env.example)
```

Vercel (web) — pasos rápidos:

1. En la UI de Vercel, crear un nuevo proyecto y elegir "Importar desde GitHub".
2. Seleccionar el repo `lynx0106/nexora-app`.
3. En "Root Directory", poner `frontend` (si tu app Next.js está en esa carpeta).
4. Build Command: `npm run build` (o dejar el que detecte Vercel). Output Directory: (Next.js no lo necesita).
5. Añadir variables de entorno en la sección "Environment Variables" (ej. `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
6. Desplegar.

Vercel CLI (opcional):

```powershell
npm i -g vercel
vercel login
cd frontend
vercel --prod  # te guiará para vincular el proyecto y hacer el deploy
```

Supabase — pasos rápidos:

1. En https://app.supabase.com crea un nuevo proyecto (elige plan gratuito si quieres).
2. En Settings > API copia `URL` y `anon` / `service_role` keys.
3. Configura `DATABASE_URL` o usa `PG` proporcionado por Supabase.
4. Para ejecutar migraciones y seeds localmente o en CI usa `supabase` CLI:

```powershell
npm i -g supabase
supabase login
supabase projects create # si quieres crear por CLI (suele hacerse por UI)

# Inicializar migraciones (ejemplo):
supabase db remote set "postgres://user:pass@host:5432/dbname"
supabase db push  # si usas la herramienta de migraciones
```

Notas importantes:
- Mantén las claves `service_role` fuera del frontend público. Solo `anon` y variables `NEXT_PUBLIC_*` pueden ir al frontend.
- Si despliegas el `backend` a Vercel, añade las variables privadas al entorno del proyecto en Vercel (Environment > Production/Preview/Development).
- Si prefieres que el backend corra en supabase functions o en otro host, ajusta las variables `DATABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` según sea necesario.

Si quieres, puedo:
- A) Ejecutar comandos `vercel login` y `vercel link` aquí si inicias sesión en la terminal.
- B) Ejecutar `supabase login` y crear configuraciones/migraciones si me proporcionas acceso temporal (recomendado hacerlo tú por seguridad).
