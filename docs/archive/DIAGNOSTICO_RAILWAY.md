# 🔍 Diagnóstico de Despliegue - Railway

**Fecha:** 24 de febrero de 2026  
**Proyecto:** nexora-app (Backend NestJS)  
**URL Actual:** https://nexora-app-production-3199.up.railway.app

---

## 🚨 Problemas Críticos Identificados

### 1. **Procfile Mal Configurado** ⚠️ CRÍTICO

**Archivo:** `Procfile`  
**Problema:** El Procfile incluye `npm ci` y `npm run build`, lo cual es incorrecto.

```
# ❌ ACTUAL (Incorrecto)
web: cd backend && npm ci && npm run build && npm run start:prod

# ✅ CORRECTO
web: cd backend && npm run start:prod
```

**Por qué falla:**
- Railway ejecuta la fase de build por separado (nixpacks.toml)
- El Procfile solo debe contener el comando de inicio
- `npm ci` puede fallar si no hay package-lock.json

---

### 2. **Script start:prod con Ruta Relativa** ⚠️ CRÍTICO

**Archivo:** `backend/package.json`  
**Línea 17:** `"start:prod": "node dist/src/main.js"`

**Problema:** El script asume que se ejecuta desde `backend/`, pero:
- Railway ejecuta desde raíz después del build
- El Procfile hace `cd backend` pero el script podría no encontrar los archivos

**Verificación necesaria:**
```bash
# Estructura actual del build
dist/
└── src/
    ├── main.js          ← Este archivo
    ├── app.module.js
    └── ...
```

**Solución:** Crear un script de inicio más robusto.

---

### 3. **TypeORM Synchronize Habilitado en Producción** ⚠️ ALTO RIESGO

**Archivo:** `backend/src/app.module.ts`  
**Líneas 57-64:**

```typescript
const shouldSync = process.env.TYPEORM_SYNCHRONIZE !== 'false';
if (shouldSync) {
  console.log('⚠️ TYPEORM_SYNCHRONIZE is enabled - tables will be auto-created');
}
return {
  ...config,
  autoLoadEntities: true,
  synchronize: shouldSync,  // ← TRUE por defecto
};
```

**Problema:** Si `TYPEORM_SYNCHRONIZE` no está definido en Railway, es `true`.
- Puede borrar datos en producción
- Puede causar errores de migración

**Solución inmediata:** Configurar variable `TYPEORM_SYNCHRONIZE=false` en Railway.

---

### 4. **Configuración de Build Duplicada/Confusa** ⚠️ MEDIA

Hay **3 formas** de configurar el build (pueden entrar en conflicto):

| Archivo | Configuración |
|---------|---------------|
| `Procfile` | `cd backend && npm ci && npm run build && npm run start:prod` |
| `nixpacks.toml` | `cmds = ["cd backend && npm run build"]` |
| `railway.json` | `"buildCommand": "npm run build"` (sin cd backend) |

**Problema:** Railway no sabe cuál usar. El orden de prioridad general es:
1. `railway.json` (si existe)
2. `nixpacks.toml` (si existe)
3. `Procfile` (fallback)

**Recomendación:** Usar solo uno (preferiblemente `railway.json`).

---

### 5. **Falta de package.json en Raíz** ⚠️ MEDIA

**Problema:** Railway busca un `package.json` en la raíz del repositorio.

**Actual:** El proyecto tiene estructura monorepo:
```
nexora-app/
├── backend/
│   └── package.json    ← Aquí está
└── frontend/
    └── package.json
```

**Solución:** Crear `package.json` raíz o configurar correctamente Railway.

---

## 📋 Checklist de Variables de Entorno (Railway)

Las siguientes variables **DEBEN** estar configuradas en el Dashboard de Railway:

### OBLIGATORIAS

| Variable | Descripción | Estado |
|----------|-------------|--------|
| `DATABASE_URL` | PostgreSQL connection string (Railway la genera automáticamente si agregas PostgreSQL) | ⚠️ Verificar |
| `SUPABASE_DATABASE_URL` | URL de Supabase (si se usa en lugar de Railway PostgreSQL) | ⚠️ Verificar |
| `JWT_SECRET` | Secreto para JWT (mínimo 32 caracteres) | 🔴 **FALTA** |
| `NODE_ENV` | Debe ser `production` | ⚠️ Verificar |
| `TYPEORM_SYNCHRONIZE` | Debe ser `false` en producción | 🔴 **FALTA** |
| `PORT` | Railway asigna automáticamente | ✅ Automático |

### Opcionales pero Recomendadas

| Variable | Descripción |
|----------|-------------|
| `FRONTEND_URL` | URL del frontend para CORS |
| `SUPABASE_URL` | URL de Supabase para Storage |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave privada de Supabase |
| `OPENAI_API_KEY` | Para funcionalidades de IA |
| `MERCADOPAGO_ACCESS_TOKEN` | Para pagos |
| `SMTP_HOST` | Para envío de emails |

---

## 🔧 Soluciones Paso a Paso

### Solución 1: Corregir el Procfile

**Archivo:** `Procfile`

```
web: cd backend && npm run start:prod
```

### Solución 2: Corregir el Script start:prod

**Archivo:** `backend/package.json`

```json
{
  "scripts": {
    "build": "nest build",
    "start:dev": "nest start --watch",
    "start:prod": "node dist/src/main.js",
    "start:prod:abs": "node backend/dist/src/main.js"
  }
}
```

Alternativa: Crear un script de inicio robusto en raíz.

### Solución 3: Crear package.json Raíz

**Nuevo archivo:** `package.json` (en raíz)

```json
{
  "name": "nexora-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "cd backend && npm ci && npm run build",
    "start": "cd backend && npm run start:prod"
  },
  "engines": {
    "node": ">=20"
  }
}
```

### Solución 4: Simplificar Configuración Railway

**Opción A - Usar railway.json (Recomendado):**

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "nixpacks",
    "buildCommand": "cd backend && npm ci && npm run build"
  },
  "deploy": {
    "startCommand": "cd backend && npm run start:prod",
    "restartPolicyType": "on_failure",
    "restartPolicyMaxRetries": 5,
    "numReplicas": 1
  }
}
```

**Opción B - Eliminar railway.json y usar solo Procfile:**

```
web: cd backend && npm run start:prod
```

Y eliminar `nixpacks.toml` si existe conflicto.

### Solución 5: Configurar Variables en Railway Dashboard

1. Ir a https://railway.app/dashboard
2. Seleccionar proyecto `nexora-app`
3. Ir a tab "Variables"
4. Agregar:
   ```
   JWT_SECRET=tu-secreto-super-largo-minimo-32-caracteres-aqui
   TYPEORM_SYNCHRONIZE=false
   NODE_ENV=production
   ```

### Solución 6: Verificar Base de Datos

**Si usas Railway PostgreSQL:**
- Railway genera `DATABASE_URL` automáticamente
- El código en `database.config.ts` la detecta automáticamente

**Si usas Supabase:**
- Agregar variable `SUPABASE_DATABASE_URL` manualmente
- Obtener de: Supabase Dashboard → Settings → Database → Connection Pooling

---

## 🧪 Comandos de Diagnóstico (Local)

Para verificar que el build funciona correctamente:

```powershell
# 1. Limpiar build anterior
Remove-Item -Recurse -Force backend/dist

# 2. Instalar dependencias
cd backend
npm ci

# 3. Build
npm run build

# 4. Verificar estructura
dir dist\src

# 5. Verificar que main.js existe
Test-Path dist\src\main.js

# 6. Prueba local (opcional)
$env:NODE_ENV="production"
$env:JWT_SECRET="test-secret-32-characters-long"
$env:TYPEORM_SYNCHRONIZE="false"
npm run start:prod
```

---

## 🎯 Plan de Acción Recomendado

### Paso 1: Corregir Configuración de Archivos (5 min)
1. ✅ Actualizar `Procfile`
2. ✅ Crear `package.json` en raíz (opcional pero recomendado)
3. ✅ Eliminar `nixpacks.toml` (si se usa railway.json)
4. ✅ Commit y push

### Paso 2: Configurar Variables en Railway (5 min)
1. ✅ Agregar `JWT_SECRET` (generar valor seguro)
2. ✅ Agregar `TYPEORM_SYNCHRONIZE=false`
3. ✅ Verificar que existe `DATABASE_URL` o `SUPABASE_DATABASE_URL`

### Paso 3: Redeploy (2 min)
1. ✅ Ir a Railway Dashboard
2. ✅ Click en "Deploy" o esperar auto-deploy
3. ✅ Verificar logs

### Paso 4: Verificación (2 min)
1. ✅ Health check: `GET /health`
2. ✅ Verificar logs sin errores
3. ✅ Probar endpoint de auth

---

## 📊 Logs Comunes y Soluciones

### Error: "JWT_SECRET no esta configurado"
**Solución:** Agregar variable `JWT_SECRET` en Railway Dashboard.

### Error: "Cannot find module './dist/src/main.js'"
**Solución:** Corregir Procfile y script start:prod.

### Error: "Connection refused" (PostgreSQL)
**Solución:** Verificar `DATABASE_URL` o agregar addon PostgreSQL en Railway.

### Error: "Port already in use" / "PORT env required"
**Solución:** Railway asigna PORT automáticamente, no hardcodear.

### Error: "synchronize is enabled, but migrations exist"
**Solución:** Establecer `TYPEORM_SYNCHRONIZE=false`.

---

## ✅ Verificación Final

Una vez aplicadas las correcciones, verificar:

```bash
# Health check
curl https://nexora-app-production-3199.up.railway.app/health

# Respuesta esperada:
{
  "status": "ok",
  "timestamp": "2026-02-24T...",
  "uptime": 123
}
```

---

**Nota:** Este diagnóstico fue generado automáticamente. Revisar los logs específicos en Railway Dashboard para errores adicionales.
