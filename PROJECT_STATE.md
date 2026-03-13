# Estado del Proyecto - Nexora App

Última actualización: 2026-03-13

## Rama actual
- **main** — commit `995264a` (chore: add APK nexora-mobile 1.0.0)

## Bugs resueltos esta sesión
- ESLint: set-state-in-effect, exhaustive-deps (page, AgendaSection, ChatSection, TeamSection, OnboardingWizard)
- App móvil: manejo error límite de plan (InviteRegisterScreen Alert + Linking)

## Tareas pendientes
- [ ] npm audit backend: 8 moderadas (ajv, file-type) — evaluar antes de --force
- [ ] Gráficos en dashboard (opcional)
- [ ] logo-fondo.png en frontend/public (si falta)

## Despliegues
- **Frontend:** Vercel — nexora-app.online ✅
- **Backend:** Railway — nexora-app-production-3104.up.railway.app ✅
- **APK:** frontend/public/nexora-mobile.apk, URL https://nexora-app.online/nexora-mobile.apk ✅
- **Variable:** NEXT_PUBLIC_APP_APK_URL configurada en Vercel ✅

## Próximo objetivo
Continuar con mejoras o features según prioridad. Para cambios en app móvil: `npx eas build` → reemplazar APK en public → push.
