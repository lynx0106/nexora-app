# Checklist Pre-Deploy - Nexora App

Lista de verificación completa antes de hacer `git push origin main` y desplegar a producción.

## ✅ Pre-Deploy Local

### Git
- [ ] Estoy en rama `main`
  ```bash
  git checkout main
  ```

- [ ] Tengo los últimos cambios
  ```bash
  git pull origin main
  ```

- [ ] No hay cambios sin commitear
  ```bash
  git status
  ```

### Builds
- [ ] **Backend build de producción exitoso**
  ```bash
  cd backend && npm run build
  ```

- [ ] **Frontend build de producción exitoso**
  ```bash
  cd frontend && npm run build
  ```

### Tests
- [ ] **Tests unitarios pasan**
  ```bash
  cd backend && npm test
  ```

- [ ] **Tests de integración pasan** (si existen)

## ✅ Variables de Entorno - Railway (Backend)

- [ ] `JWT_SECRET` - Seguro (32+ caracteres, aleatorio)
- [ ] `SUPABASE_DATABASE_URL` - URL de conexión PostgreSQL
- [ ] `SUPABASE_URL` - URL del proyecto Supabase
- [ ] `SUPABASE_SERVICE_ROLE_KEY` - Key privada
- [ ] `NODE_ENV=production`
- [ ] `TYPEORM_SYNCHRONIZE=false` ⚠️ CRÍTICO
- [ ] `CORS_ORIGINS` - URLs del frontend permitidas
  ```
  https://nexora-app.online,https://www.nexora-app.online
  ```

### Opcionales pero Recomendadas
- [ ] `FRONTEND_URL` - URL del frontend
- [ ] `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` - Para emails
- [ ] `OPENAI_API_KEY` - Para funcionalidades de IA
- [ ] `MERCADOPAGO_ACCESS_TOKEN` - Para pagos

## ✅ Variables de Entorno - Vercel (Frontend)

- [ ] `NEXT_PUBLIC_API_URL` - URL del backend Railway
  ```
  https://nexora-app-production-3104.up.railway.app
  ```
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## ✅ Configuración CORS

- [ ] Backend permite origen del frontend
  - Archivo: `backend/src/config/runtime.config.ts`
  - Debe incluir: `https://nexora-app.online`

- [ ] Frontend apunta a URL correcta del backend
  - Archivo: `frontend/src/lib/api.ts`
  - Debe ser: `https://nexora-app-production-XXXX.up.railway.app`

## ✅ Base de Datos (Supabase)

- [ ] Migraciones aplicadas
- [ ] Datos de prueba cargados (si es necesario)
- [ ] Row Level Security (RLS) configurado

## ✅ Post-Deploy Verificación

Después del deploy, verificar:

### Backend (Railway)
```bash
curl https://nexora-app-production-3104.up.railway.app/health
# Debe responder: {"status":"ok",...}
```

### Frontend (Vercel)
- [ ] Login funciona
- [ ] No hay errores CORS en consola
- [ ] Conexión a backend OK

### Funcionalidad
- [ ] Login con superadmin funciona
- [ ] Dashboard carga datos
- [ ] CRUD básico funciona

## ⚡ Script Automático

Ejecuta todas estas validaciones:

```powershell
.agents/skills/nexora-validation/scripts/pre-deploy-check.ps1
```

## Si Falla el Deploy...

1. Revisar logs en Railway Dashboard
2. Revisar logs en Vercel Dashboard
3. Verificar variables de entorno
4. Verificar CORS configurado
5. Hacer rollback si es necesario: `git revert HEAD`

## URLs de Monitoreo

| Servicio | URL |
|----------|-----|
| Backend Health | `https://nexora-app-production-3104.up.railway.app/health` |
| Frontend | `https://nexora-app.online` |
| Railway Dashboard | `https://railway.app/dashboard` |
| Vercel Dashboard | `https://vercel.com/dashboard` |
| Supabase | `https://app.supabase.com` |
