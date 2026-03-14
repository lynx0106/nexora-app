# Estado del Proyecto - Nexora App

Última actualización: 2026-03-13

## Rama actual
- **main** — commit `23954c0` (fix: employeeType type varchar explícito para PostgreSQL)

## Bugs resueltos esta sesión
- Crash Railway: `DataTypeNotSupportedError` en `User.employeeType` — corregido con `type: 'varchar'` explícito
- Blindaje seguridad: SetupGuard, contraseñas desde env, CSP, endpoints /db-init y /users/public/* protegidos

## Tareas pendientes
- [ ] **Build APK en espera:** EAS build `cf96d827-980e-4fde-a572-f2b9c8d0233d` en cola. Cuando termine: descargar, `.\scripts\download-apk.ps1`, commit en frontend/public/, push
- [ ] npm audit backend: 8 moderadas (ajv, file-type) — evaluar antes de --force
- [ ] Gráficos en dashboard (opcional)

## Despliegues
- **Frontend:** Vercel — nexora-app.online ✅
- **Backend:** Railway — nexora-app-production-3104.up.railway.app ✅ (tras fix employeeType)
- **APK:** frontend/public/nexora-mobile.apk (build anterior). Build nuevo pendiente.
- **Variable:** NEXT_PUBLIC_APP_APK_URL en Vercel ✅

## Próximo objetivo
Verificar build EAS `cf96d827` cuando salga de cola. Si status=finished, descargar APK, actualizar frontend/public/, commit y push para renovar APK en landing.
