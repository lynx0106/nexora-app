---
name: nexora-troubleshooting
description: Skill de diagnostico y resolucion rapida de problemas comunes en Nexora App. Usar INMEDIATAMENTE cuando aparezca error en consola, deploy falle, o funcionalidad no responda. Proporciona soluciones paso a paso optimizadas para minimizar tiempo de debug y tokens. Incluye diagnosticos para CORS, 405, 401, 500, database connection failed, y deploy issues.
---

# Troubleshooting Rápido - Nexora App

Skill para diagnosticar y resolver problemas comunes en segundos, no minutos.

## ⚡ Cuándo Usar INMEDIATAMENTE

**NO pienses, usa esta skill cuando veas:**

- ❌ `Failed to fetch` en navegador
- ❌ `CORS policy` bloqueando petición
- ❌ `405 Method Not Allowed`
- ❌ `401 Unauthorized`
- ❌ `500 Internal Server Error`
- ❌ `ERR_FAILED` o `net::ERR_CONNECTION_REFUSED`
- ❌ Deploy en Railway/Vercel falla
- ❌ Backend no responde (timeout)

## 🎯 Objetivo: Optimizar Tokens y Tiempo

**Sin esta skill:**
- 15 min analizando logs
- 20 mensajes intercambiados
- 5000 tokens gastados

**Con esta skill:**
- 2 min ejecutando script
- 1 mensaje con solución
- 500 tokens usados

## 🚀 Diagnóstico en 3 Pasos

### Paso 1: Identificar el Error

Busca el mensaje exacto en tu consola/error:

| Error | Sección |
|-------|---------|
| `CORS policy` / `No 'Access-Control-Allow-Origin'` | [CORS Issues](#cors-issues) |
| `405 Method Not Allowed` | [405 Error](#405-error) |
| `401 Unauthorized` | [Auth Issues](#auth-issues) |
| `Failed to fetch` / `ERR_FAILED` | [Connection Issues](#connection-issues) |
| Deploy falla en Railway | [Deploy Issues](#deploy-issues) |
| `DATABASE_URL` no conecta | [Database Issues](#database-issues) |

### Paso 2: Ejecutar Script de Diagnóstico

```powershell
# Diagnóstico automático del error
.agents/skills/nexora-troubleshooting/scripts/diagnostico-rapido.ps1 -Error "CORS"
```

### Paso 3: Aplicar Solución

Sigue el paso a paso de la sección correspondiente (1-2 minutos).

---

## CORS Issues

### Síntomas
- `Access to fetch blocked by CORS policy`
- `No 'Access-Control-Allow-Origin' header`
- `Response to preflight request doesn't pass`

### Diagnóstico Rápido (30 segundos)

```powershell
# Verificar si CORS está configurado
Invoke-RestMethod -Uri "https://nexora-app-production-3104.up.railway.app/health" -Method GET

# Verificar headers CORS
Invoke-WebRequest -Uri "https://nexora-app-production-3104.up.railway.app/auth/login" `
  -Method OPTIONS -Headers @{"Origin"="https://nexora-app.online"} -UseBasicParsing
```

### Solución (2 minutos)

**Si headers CORS faltan:**

1. Verificar variable `CORS_ORIGINS` en Railway:
   ```
   https://nexora-app.online,https://www.nexora-app.online
   ```

2. Si variable no funciona, código no está actualizado:
   - Railway muestra commit antiguo
   - Ir a [Deploy Issues](#deploy-issues)

**Si CORS config está OK pero sigue fallando:**
- Problema es 405 en OPTIONS, no CORS
- Ir a [405 Error](#405-error)

---

## 405 Error

### Síntomas
- `405 Method Not Allowed`
- `Failed to load resource: the server responded with a status of 405`
- Pasa solo en POST/PUT/DELETE, GET funciona

### Causa Root
Backend no tiene el código actualizado con manejo de OPTIONS.

### Solución (5 minutos)

**Opción A: Variable de entorno (rápido, 30s)**
```
Railway Dashboard → Variables → CORS_ORIGINS=*
```
Redeploy automático.

**Opción B: Fix en código (permanente, 5min)**
El código actualizado está en `backend/src/main.ts`:

```typescript
// Handle OPTIONS preflight
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', corsOrigins.join(', '));
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.status(204).send();
  }
  next();
});
```

Problema: Railway no tiene este código. Ver [Deploy Issues](#deploy-issues).

---

## Connection Issues

### Síntomas
- `Failed to fetch`
- `net::ERR_FAILED`
- `ERR_CONNECTION_REFUSED`
- Backend no responde

### Diagnóstico (1 minuto)

```powershell
# Test 1: Health check
Invoke-RestMethod -Uri "https://nexora-app-production-3104.up.railway.app/health"

# Test 2: URL correcta
# Si falla, verificar URL en frontend/src/lib/api.ts
```

### Soluciones

**Si health check falla:**
- Backend caído, ver Railway Dashboard
- Ir a [Deploy Issues](#deploy-issues)

**Si health check OK pero frontend falla:**
- URL incorrecta en frontend
- Verificar `frontend/src/lib/api.ts` tenga URL de Railway

---

## Deploy Issues

### Síntomas
- Railway muestra "Failed" en deploy
- Vercel build falla
- Commits no se reflejan en deploy

### Diagnóstico (1 minuto)

```powershell
# Verificar último commit en GitHub
git log --oneline -1

# Comparar con commit en Railway
# Railway Dashboard → Deployments → Ver commit hash
```

### Solución: Railway No Sincroniza (Problema Actual)

**Síntoma:** GitHub tiene commit `be8d309`, Railway tiene `3586ced0`

**Soluciones (en orden):**

1. **Redeploy manual con limpieza de caché:**
   - Railway → Deployments → ⋮ → Redeploy
   - Desmarcar "Use cache"

2. **Verificar webhook GitHub:**
   - GitHub → Settings → Webhooks
   - Buscar webhook de Railway
   - Si no existe: reconectar repo en Railway

3. **Variable como workaround:**
   - Configurar en Railway Dashboard → Variables
   - Aplica inmediatamente sin necesidad de código

4. **Nuevo proyecto (nuclear option):**
   - Crear nuevo proyecto Railway
   - Conectar a mismo repo GitHub
   - Configurar variables de entorno
   - Actualizar URL en frontend

---

## Auth Issues

### Síntomas
- `401 Unauthorized`
- Login falla con credenciales correctas
- Token expirado

### Soluciones

**401 en login:**
- Credenciales incorrectas en BD
- Verificar `REPORTE_USUARIOS_PRUEBA.md`

**401 en requests autenticadas:**
- Token expirado (7 días por defecto)
- Re-login
- Verificar JWT_SECRET coincide en Railway

---

## Database Issues

### Síntomas
- `DATABASE_URL` error
- `Connection refused` PostgreSQL
- `SSL/TLS required`

### Solución

1. Verificar URL en Railway Dashboard → Variables
2. Formato correcto:
   ```
   postgresql://user:pass@host:6543/postgres?pgbouncer=true
   ```
3. Asegurar `SSL` configurado:
   ```typescript
   ssl: { rejectUnauthorized: false }
   ```

---

## Scripts de Diagnóstico

### Diagnóstico Completo
```powershell
.agents/skills/nexora-troubleshooting/scripts/diagnostico-rapido.ps1
```

### Test CORS Específico
```powershell
.agents/skills/nexora-troubleshooting/scripts/test-cors.ps1 -Url "https://nexora-app-production-3104.up.railway.app"
```

### Verificar Deploy
```powershell
.agents/skills/nexora-troubleshooting/scripts/verificar-deploy.ps1
```

---

## Referencias Rápidas

| Recurso | URL |
|---------|-----|
| Railway Dashboard | https://railway.app/dashboard |
| Vercel Dashboard | https://vercel.com/dashboard |
| Backend Health | https://nexora-app-production-3104.up.railway.app/health |
| Frontend | https://nexora-app.online |
| GitHub Repo | https://github.com/lynx0106/nexora-app |

## Decision Tree

```
¿Error en navegador?
├── Sí → ¿CORS policy?
│   ├── Sí → Solución CORS
│   └── No → ¿405?
│       ├── Sí → Solución 405
│       └── No → ¿401?
│           ├── Sí → Auth issues
│           └── No → Connection issues
└── No → ¿Error en deploy?
    ├── Sí → Deploy issues
    └── No → ¿Database error?
        └── Sí → Database issues
```

---

**Recordatorio:** Esta skill está diseñada para resolver problemas en <5 minutos. Si después de seguir los pasos el problema persiste, documentarlo en `SESIONES.md` para análisis profundo.
