# ✅ Nexora App - Checklist de Despliegue y Verificación

## 📋 Resumen del Sistema

| Componente | URL/Estado |
|------------|------------|
| **Backend** | https://nexora-app-production-3104.up.railway.app |
| **Frontend** | https://nexora-app.online |
| **Database** | Supabase (Session Pooler) |
| **Mobile App** | Usa API_URL dinámico via variables de entorno |

---

## 🔧 Configuraciones Completadas

### 1. Backend (Railway)

✅ **Variables de Entorno Necesarias:**
```env
# Database (Obligatorio)
SUPABASE_DATABASE_URL=postgresql://postgres.cafcekxkqyedvwstugqr:[PASSWORD]@aws-1-us-east-1.pooler.supabase.com:5432/postgres

# JWT (Obligatorio)
JWT_SECRET=tu_secreto_jwt_seguro

# CORS (Opcional, tiene defaults)
CORS_ORIGINS=https://nexora-app.online,https://www.nexora-app.online

# Frontend URL (Opcional)
FRONTEND_URL=https://nexora-app.online
```

✅ **CORS Configurado** para:
- `https://nexora-app.online`
- `https://www.nexora-app.online`
- `https://nexora-app-production-3104.up.railway.app`
- `http://localhost:3000` (dev)
- `http://localhost:3002` (dev)

✅ **Auth Configurado**:
- Cookies httpOnly con `sameSite: 'none'` y `secure: true` (cross-domain)
- Token JWT también retornado en body (para mobile/localStorage)
- Rate limiting en endpoints de auth

✅ **Base de Datos**:
- Configuración flexible (Supabase > Railway PostgreSQL > Local)
- Session Pooler (puerto 5432) para TypeORM
- SSL habilitado para conexiones cloud

---

### 2. Frontend (Vercel)

✅ **Variables de Entorno:**
```env
# Archivo: frontend/.env.production
NEXT_PUBLIC_API_URL=https://nexora-app-production-3104.up.railway.app
```

✅ **Código Actualizado**:
- `frontend/src/lib/api.ts` ahora usa `process.env.NEXT_PUBLIC_API_URL`
- Auth con localStorage fallback para cross-domain
- Cookies con credentials: 'include'

---

### 3. Mobile App (Expo/React Native)

✅ **Configuración de Variables de Entorno:**

**Archivo:** `nexora-mobile/.env.local` (desarrollo)
```env
EXPO_PUBLIC_API_URL=http://localhost:4001
```

**Archivo:** `nexora-mobile/.env.production` (producción)
```env
EXPO_PUBLIC_API_URL=https://nexora-app-production-3104.up.railway.app
```

✅ **Código Configurado**:
- `src/config/api.config.ts` - Configuración centralizada
- `src/api/http-client.ts` - Usa la configuración

---

### 4. GitHub Actions (Auto-Deploy)

✅ **Archivo:** `.github/workflows/deploy.yml`

**Requiere en GitHub Secrets:**
```
RAILWAY_TOKEN=tu_token_de_railway
```

**Para obtener el token:**
1. Ve a [Railway Dashboard](https://railway.app)
2. Account Settings → Tokens
3. New Token → Copy
4. Ve a GitHub → Settings → Secrets → Actions
5. New repository secret → RAILWAY_TOKEN

---

## 🚀 Pasos para Deploy

### Backend (Automático)
```bash
# Cada push a main activa el deploy
git add .
git commit -m "feat: nueva funcionalidad"
git push origin main
# Railway deploya automáticamente
```

### Frontend (Vercel)
```bash
cd frontend
# Vercel detecta el push y deploya automáticamente
```

### Mobile App (Manual)
```bash
cd nexora-mobile

# 1. Configurar variables
npm install

# 2. Para desarrollo
npx expo start

# 3. Para producción (build)
eas build --platform android --profile production
# o
eas build --platform ios --profile production
```

---

## 🧪 Pruebas de Verificación

### 1. Backend Health Check
```bash
curl https://nexora-app-production-3104.up.railway.app/health
# Esperado: { "status": "ok" }
```

### 2. API Documentation
```
https://nexora-app-production-3104.up.railway.app/api/docs
```

### 3. Flujo de Auth
```bash
# Registro
curl -X POST https://nexora-app-production-3104.up.railway.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}'

# Login
curl -X POST https://nexora-app-production-3104.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## 📋 Variables Detalladas

Para lista completa de variables Backend/Frontend, ver **DEPLOY_ENVIRONMENT_VARIABLES.md**.

**Variables críticas en Railway:**
- `TYPEORM_SYNCHRONIZE=false` (obligatorio en producción)
- `NODE_ENV=production`
- `CORS_ORIGINS` sin `*` (usar orígenes específicos)

---

## ⚠️ Notas Importantes

### Para Cambiar la URL del Backend

1. **Railway asigna nueva URL:**
   - Actualizar `frontend/.env.production`
   - Actualizar `nexora-mobile/.env.production`
   - Actualizar `backend/src/config/runtime.config.ts` (producción defaults)
   - Re-deploy frontend
   - Re-compilar app móvil

2. **Usar dominio propio (recomendado):**
   - Configurar dominio personalizado en Railway
   - Usar ese dominio en todas las configs
   - La URL nunca cambia en re-deploys

### Seguridad
- ✅ JWT_SECRET debe ser único y seguro en producción
- ✅ Cookies configuradas correctamente para cross-domain
- ✅ Rate limiting activado en auth endpoints
- ✅ Helmet headers habilitados
- ✅ CORS restringido a dominios permitidos

### Database
- ✅ Usando Session Pooler (puerto 5432) - compatible con TypeORM
- ❌ No usar Transaction Pooler (puerto 6543) - causa errores con prepared statements

---

## 📞 Troubleshooting

| Problema | Solución |
|----------|----------|
| Error CORS | Verificar `CORS_ORIGINS` incluye el dominio del frontend |
| Error 401 | Token expirado o inválido. Login nuevamente. |
| Error DB | Verificar `SUPABASE_DATABASE_URL` usa puerto 5432 (Session Pooler) |
| Deploy falla | Verificar `RAILWAY_TOKEN` en GitHub Secrets |
| Mobile no conecta | Verificar `EXPO_PUBLIC_API_URL` está configurada en build time |

---

## ✅ Estado Final

- [x] Backend configurado con variables de entorno
- [x] Frontend usa variables de entorno para API URL
- [x] Mobile app usa variables de entorno para API URL
- [x] CORS configurado para cross-domain
- [x] Auth con cookies + token fallback
- [x] GitHub Actions workflow creado
- [x] Documentación de despliegue creada

**La aplicación está lista para producción.** 🚀
