# Configuración Railway CLI y MCP

Para que el MCP de Railway funcione en Cursor, el proyecto debe estar vinculado al servicio correcto.

## Si `list-variables` falla con "No service linked"

La configuración de Railway reside en `~/.railway/config.json`. El MCP usa la ruta del workspace (ej. `c:\Nexora-App.online`) para buscar el proyecto. En Windows, la capitalización puede variar (`C:\` vs `c:\`).

### Solución rápida

1. Ejecutar desde la raíz del proyecto:
   ```bash
   npx @railway/cli link --project 207a9fb8-6203-4a8f-ac4f-bac2b5ed474f --environment production --service nexora-app
   ```

2. Si el MCP sigue fallando, verificar en `~/.railway/config.json` que la entrada con la ruta del workspace (en minúsculas si Cursor la pasa así) tenga `service` definido:
   ```json
   "c:\\Nexora-App.online": {
     "project": "207a9fb8-6203-4a8f-ac4f-bac2b5ed474f",
     "environment": "ceed4e96-1d78-416c-bd93-fb165028224e",
     "service": "b9f94d3d-7d3e-47d8-bd75-ae501f6f0bd4"
   }
   ```

### IDs del proyecto Nexora-App

| Recurso   | ID                                      |
|----------|------------------------------------------|
| Proyecto | `207a9fb8-6203-4a8f-ac4f-bac2b5ed474f`   |
| Env prod | `ceed4e96-1d78-416c-bd93-fb165028224e`   |
| Servicio | `b9f94d3d-7d3e-47d8-bd75-ae501f6f0bd4`   |
| URL      | https://nexora-app-production-3104.up.railway.app |

### Verificar vinculación

```bash
npx @railway/cli status
# Debe mostrar: Project: Nexora-App, Environment: production, Service: nexora-app
```
