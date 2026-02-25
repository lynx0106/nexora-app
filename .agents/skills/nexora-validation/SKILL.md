---
name: nexora-validation
description: Skill para validar código, tests y configuración de despliegue antes de commits y deploys en el proyecto Nexora App. Ejecuta validaciones pre-commit (builds, tests, seguridad) y pre-deploy (checklist de producción, variables de entorno, configuración Railway/Vercel). Usar antes de git commit/push o deploy a producción.
---

# Validación Pre-Commit y Pre-Deploy - Nexora App

Skill para garantizar calidad de código y configuración correcta antes de commits y despliegues en el ecosistema Nexora (backend NestJS, frontend Next.js, Railway, Vercel, Supabase).

## Cuándo Usar Esta Skill

**Antes de git commit:**
- Validar que el código compila (TypeScript sin errores)
- Ejecutar tests automatizados
- Verificar no hay console.log en producción
- Detectar credenciales hardcodeadas

**Antes de git push / deploy:**
- Validar builds de producción funcionan
- Verificar variables de entorno configuradas
- Validar CORS y URLs de backend/frontend
- Completar checklist de despliegue

## Scripts Disponibles

| Script | Propósito | Cuándo Ejecutar |
|--------|-----------|-----------------|
| `pre-commit-check.ps1` | Validaciones locales rápidas | Antes de `git commit` |
| `pre-deploy-check.ps1` | Validaciones completas de producción | Antes de `git push origin main` |
| `validate-deployment-config.ps1` | Verificar configuración Railway/Vercel | Cuando se modifican configs de deploy |

## Uso Rápido

### Pre-commit (Validación Rápida)

```powershell
# Desde la raíz del proyecto
.agents/skills/nexora-validation/scripts/pre-commit-check.ps1
```

**Valida:**
- ✅ Backend compila (TypeScript)
- ✅ Tests existentes pasan
- ✅ No hay console.log en producción
- ✅ No hay credenciales hardcodeadas obvias
- ✅ Archivos .env presentes

**Si hay errores:** Corrige antes de hacer commit

### Pre-deploy (Validación Completa)

```powershell
# Desde la raíz del proyecto
.agents/skills/nexora-validation/scripts/pre-deploy-check.ps1
```

**Valida:**
- ✅ Rama actual es `main`
- ✅ No hay cambios sin commitear
- ✅ Build de producción exitoso (backend y frontend)
- ✅ Tests pasan
- ✅ Variables de entorno configuradas
- ✅ Checklist de despliegue revisado

**Si todo OK:** Procede con `git push origin main`

## Flujo de Trabajo Recomendado

### 1. Durante Desarrollo

```powershell
# Haces cambios en el código...

# 1. Validar rápidamente
.agents/skills/nexora-validation/scripts/pre-commit-check.ps1

# 2. Si pasa, hacer commit
git add .
git commit -m "feat: nueva funcionalidad"
```

### 2. Antes de Deploy

```powershell
# 1. Cambiar a main y traer cambios
git checkout main
git pull origin main

# 2. Merge de tu rama (si aplica)
git merge tu-rama

# 3. Validación completa
.agents/skills/nexora-validation/scripts/pre-deploy-check.ps1

# 4. Si todo OK, deploy
git push origin main
```

## Referencias Detalladas

Para información específica de cada tipo de validación:

- **Checklist de Pre-commit:** [references/pre-commit-checklist.md](references/pre-commit-checklist.md)
- **Checklist de Deploy:** [references/deployment-checklist.md](references/deployment-checklist.md)
- **Guía de Testing:** [references/testing-guide.md](references/testing-guide.md)

## Errores Comunes y Soluciones

### "Backend tiene errores de compilación TypeScript"
**Causa:** Errores de tipo o sintaxis en código NestJS
**Solución:** Revisa `npm run build` en carpeta `backend/`

### "Tests fallaron"
**Causa:** Cambios rompieron funcionalidad existente
**Solución:** Ejecuta `npm test` en backend/frontend y corrige

### "Hay cambios sin commitear"
**Causa:** Intentas hacer deploy con código no guardado
**Solución:** `git add . && git commit -m "mensaje"`

### "API_URL no apunta a Railway"
**Causa:** Frontend apunta a URL local o antigua
**Solución:** Actualizar `frontend/src/lib/api.ts` con URL de Railway

### "CORS no configurado"
**Causa:** Backend no acepta peticiones del dominio frontend
**Solución:** Verificar `backend/src/config/runtime.config.ts`

## Configuración de Variables de Entorno

La skill verifica estas variables críticas:

### Backend (Railway)
- `JWT_SECRET` - Debe ser seguro (32+ caracteres)
- `SUPABASE_DATABASE_URL` - Conexión a PostgreSQL
- `NODE_ENV=production`
- `TYPEORM_SYNCHRONIZE=false` (en producción)
- `CORS_ORIGINS` - URLs del frontend permitidas

### Frontend (Vercel)
- `NEXT_PUBLIC_API_URL` - URL del backend Railway
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Comandos Útiles

### Verificar Health del Backend
```powershell
Invoke-RestMethod -Uri "https://nexora-app-production-3104.up.railway.app/health"
```

### Test Login Directo
```powershell
$body = @{email="superadmin@saas.com";password="SuperAdmin2024!"} | ConvertTo-Json
Invoke-RestMethod -Uri "https://nexora-app-production-3104.up.railway.app/auth/login" -Method POST -Body $body -ContentType "application/json"
```

### Verificar Variables en Railway
Railway Dashboard → Variables → Verificar que existan todas

## Notas Importantes

- **Siempre ejecuta pre-commit-check antes de commit**
- **Siempre ejecuta pre-deploy-check antes de push a main**
- Los scripts asumen que estás en la raíz del proyecto
- Los scripts funcionan en PowerShell (Windows) y pwsh (Linux/Mac)

---

**Última actualización:** 2026-02-24  
**Versión:** 1.0.0
