# Configuración de Seguridad - Nexora App

## Endpoints protegidos (SetupGuard)

Los siguientes endpoints requieren **protección adicional** en producción:

| Ruta | Descripción |
|------|-------------|
| `POST /db-init/setup` | Inicializa BD y crea superadmin |
| `GET /db-init/status` | Estado de tablas y conteos |
| `POST /db-init/create-superadmin` | Crea/resetea superadmin |
| `POST /db-init/create-demo-users` | Crea usuarios demo |
| `POST /users/seed-superadmin` | Seed superadmin vía service |
| `POST /users/public/seed-superadmin` | Seed superadmin (emergencia) |
| `POST /users/public/fix-superadmin` | Resetea contraseña superadmin |
| `GET /users/public/diagnostic` | Lista usuarios (solo con secret) |

### Comportamiento

- **Desarrollo:** Acceso permitido sin secret (para setup local).
- **Producción sin SETUP_SECRET:** Todos bloqueados con 403.
- **Producción con SETUP_SECRET:** Requiere header `X-Setup-Secret: <valor>` igual a `SETUP_SECRET`.

### Uso en producción

```bash
# Con secret configurado en Railway/Vercel
curl -X POST https://nexora-app-production-3104.up.railway.app/users/public/seed-superadmin \
  -H "X-Setup-Secret: tu-secret-configurado-en-env"
```

## Variables de entorno obligatorias (producción)

| Variable | Uso |
|----------|-----|
| `SETUP_SECRET` | Token para endpoints de setup. Sin él, en prod están bloqueados. |
| `SUPERADMIN_PASSWORD` | Contraseña del superadmin. Obligatoria en producción. |
| `SUPERADMIN_EMAIL` | Email del superadmin (opcional, default: superadmin@saas.com) |
| `DEMO_USERS_PASSWORD` | Solo si usas `/db-init/create-demo-users` en producción |

## Scripts locales

Los scripts `seed-via-api.ts` y `reset-and-seed-superadmin.ts` usan la API. En desarrollo no requieren header. Si necesitas ejecutarlos contra producción, configura `SETUP_SECRET` y añade el header en el script.
