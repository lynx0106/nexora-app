# 🚀 Variables de Entorno para Producción

**Fecha de actualización:** 24 de febrero de 2026  
**Proyecto:** Nexora App - Security Overhaul Deploy

---

## 🔴 BACKEND - Variables Requeridas

### Seguridad Crítica (NUEVAS)

| Variable | Valor Ejemplo | Descripción | Requerida |
|----------|---------------|-------------|-----------|
| `SUPERADMIN_PASSWORD` | `SuperSecureP@ssw0rd!2026` | Contraseña para superadmin (NO usar valor por defecto) | ✅ SÍ |
| `LOG_LEVEL` | `log` | Nivel de logging: verbose, debug, log, warn, error, fatal | ✅ SÍ |
| `NODE_ENV` | `production` | Entorno de ejecución | ✅ SÍ |

### Variables Existentes (Verificar)

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `DATABASE_URL` o `SUPABASE_DATABASE_URL` | URL de conexión a PostgreSQL | ✅ SÍ |
| `JWT_SECRET` | Secreto para firmar JWT (mínimo 32 caracteres) | ✅ SÍ |
| `TYPEORM_SYNCHRONIZE` | Debe ser `false` en producción | ✅ SÍ |
| `FRONTEND_URL` | URL del frontend (https://nexora-app.online) | ✅ SÍ |
| `CORS_ORIGINS` | Orígenes permitidos para CORS | ✅ SÍ |
| `RATE_LIMIT_TTL` | Tiempo de ventana para rate limiting (60) | ⚠️ Opcional |
| `RATE_LIMIT_LIMIT` | Límite de requests por ventana (100) | ⚠️ Opcional |
| `MERCADOPAGO_ACCESS_TOKEN` o `MP_ACCESS_TOKEN` | Token de MercadoPago | ⚠️ Si usa pagos |
| `OPENAI_API_KEY` | API Key de OpenAI | ⚠️ Opcional |
| `SENTRY_DSN` | DSN para Sentry error tracking | ⚠️ Opcional |

---

## 🌐 FRONTEND - Variables Requeridas

### Variables Públicas (NEXT_PUBLIC_*)

| Variable | Valor Ejemplo | Descripción | Requerida |
|----------|---------------|-------------|-----------|
| `NEXT_PUBLIC_API_URL` | `https://api.nexora-app.online` | URL del backend API | ✅ SÍ |
| `NEXT_PUBLIC_APP_NAME` | `Nexora` | Nombre de la aplicación | ⚠️ Opcional |

---

## 🔧 Configuración de Railway (Backend)

### Pasos para configurar:

1. **Ir a Railway Dashboard:** https://railway.app/
2. **Seleccionar proyecto:** `nexora-app-production`
3. **Ir a Variables:** Click en "Variables"
4. **Agregar nuevas variables:**

```bash
# Seguridad
SUPERADMIN_PASSWORD=TuPasswordSeguroAqui123!
LOG_LEVEL=log
NODE_ENV=production

# CORS (actualizar para incluir dominio de producción)
CORS_ORIGINS=https://nexora-app.online,https://www.nexora-app.online
```

---

## 🔧 Configuración de Vercel (Frontend)

### Pasos para configurar:

1. **Ir a Vercel Dashboard:** https://vercel.com/dashboard
2. **Seleccionar proyecto:** `frontend`
3. **Ir a Settings > Environment Variables**
4. **Agregar/Actualizar:**

```bash
NEXT_PUBLIC_API_URL=https://nexora-app-production-3104.up.railway.app
```

---

## ⚠️ CHECKLIST PRE-DEPLOY

### Backend (Railway)
- [ ] `SUPERADMIN_PASSWORD` configurada (NO usar default)
- [ ] `JWT_SECRET` es fuerte (mínimo 32 caracteres aleatorios)
- [ ] `NODE_ENV=production` configurado
- [ ] `CORS_ORIGINS` incluye dominio de producción
- [ ] Base de datos migrada (si aplica)
- [ ] Logs de build revisados (sin errores)

### Frontend (Vercel)
- [ ] `NEXT_PUBLIC_API_URL` apunta a backend de producción
- [ ] Build local exitoso (`npm run build`)
- [ ] Sin errores de linting (`npm run lint`)

### DNS/SSL
- [ ] Dominio `nexora-app.online` apunta a Vercel
- [ ] Certificado SSL válido
- [ ] Redirección HTTP → HTTPS activa

---

## 🧪 POST-DEPLOY CHECKLIST

### Testing de Seguridad
- [ ] Login funciona con cookies (verificar en DevTools)
- [ ] Cookie `access_token` es httpOnly (no visible en JS)
- [ ] Rate limiting activo (5 intentos por minuto)
- [ ] Bloqueo tras 5 intentos fallidos
- [ ] Logout limpia las cookies
- [ ] Upload de archivos rechaza archivos maliciosos

### Testing Funcional
- [ ] Login con credenciales válidas
- [ ] Dashboard carga correctamente
- [ ] Chat en tiempo real funciona
- [ ] Creación de pedidos funciona
- [ ] Webhooks de MercadoPago recibidos

---

## 🚨 ROLLBACK PLAN

Si algo sale mal:

1. **Revertir en Git:**
   ```bash
   git revert HEAD~5..HEAD  # Revertir commits de seguridad
   git push origin main
   ```

2. **Redeploy en Railway:**
   - Railway auto-deploy en push a main
   - O usar "Redeploy" en dashboard

3. **Redeploy en Vercel:**
   - Vercel auto-deploy en push a main
   - O usar "Redeploy" en dashboard

4. **Notificar equipo:**
   - Slack/Discord del equipo
   - Status page (si aplica)

---

## 📞 CONTACTOS DE EMERGENCIA

| Rol | Nombre | Contacto |
|-----|--------|----------|
| Tech Lead | [Nombre] | [Email/Phone] |
| DevOps | [Nombre] | [Email/Phone] |
| Product Owner | [Nombre] | [Email/Phone] |

---

**Documento generado:** 24 de febrero de 2026  
**Última actualización:** 24 de febrero de 2026
