# 📋 Plan de Trabajo - Nexora App

**Fecha:** 10 de marzo de 2026  
**Objetivo:** Organizar el proyecto, limpiar archivos redundantes y preparar la base para desarrollo sin dañar funcionalidades existentes.

---

## ✅ Fase 0: Limpieza Inicial (COMPLETADA)

Ejecutada con skill `nexora-cleanup`. No modifica código ni funcionalidades.

- [x] Ejecutar `analizar-limpieza.ps1`
- [x] Eliminar logs locales (`*.log`)
- [x] Crear `docs/archive/` para documentación obsoleta
- [x] Archivar diagnósticos y planes completados
- [x] Verificar que build backend y frontend siguen funcionando

---

## 📌 Fase 1: Validación Pre-Desarrollo ✅ (Completada 2026-03-10)

Antes de cualquier cambio de código. Usar skill `nexora-validation`.

- [x] Ejecutar `pre-commit-check.ps1`
- [x] Backend: `cd backend && npm run build` → sin errores
- [x] Frontend: `cd frontend && npm run build` → sin errores
- [x] Tests backend: `cd backend && npm test` → 23 suites, 294 tests OK
- [x] Git: `git status` al día

---

## 📌 Fase 2: Correcciones P0 (Críticas) ✅ (Completada 2026-03-10)

Según `ANALISIS_INTEGRAL_NEXORA_APP.md`.

- [x] **P0.1** Eliminar `console.log` CORS debug en `backend/src/main.ts`
- [x] **P0.2** TYPEORM: en producción sync=false por defecto (app.module)
- [x] **P0.3** CORS: rechazar `*` en producción (runtime.config)
- [x] **P0.4** Corregir 3 test suites fallidos del backend

---

## 📌 Fase 3: Documentación y Referencias ✅ (Completada 2026-03-10)

- [x] Actualizar `API_DOCUMENTATION.md` con URL correcta (3104)
- [x] Actualizar `DIRECTRICES_PROYECTO.md` con URL correcta
- [x] Consolidar checklists si hay solapamiento (DEPLOY_CHECKLIST + DEPLOY_ENVIRONMENT_VARIABLES actualizados)
- [x] Mantener `SESIONES.md` actualizado al final de cada sesión

---

## 📌 Fase 4: Mejoras P1 (Importantes) ⏳ Parcial

- [x] Añadir security headers en `frontend/next.config.ts`
- [x] Añadir tests frontend básicos (api, page smoke test)
- [x] Lazy loading con `dynamic()` para ChatSection, ChatWidget, SettingsSection, AuditSection
- [x] Usar `next/image` para logos y producto en ProductsSection
- [x] Revisar `.env.example` en backend y actualizar variables

---

## 📌 Fase 5: Mantenimiento Periódico

Usar skill `nexora-cleanup` mensualmente.

- [ ] Semanal: Revisar logs (`*.log`)
- [ ] Mensual: Ejecutar `analizar-limpieza.ps1`
- [ ] Mensual: Revisar documentos en `docs/archive/` para descartar definitivamente
- [ ] Antes de release: Ejecutar `pre-deploy-check.ps1`

---

## 🗂️ Estructura del Proyecto (Post-Limpieza)

```
nexora-app/
├── .agents/skills/       # Skills activas (no tocar)
├── backend/              # API NestJS
│   ├── src/
│   └── scripts/
├── frontend/             # Next.js
├── nexora-mobile/        # Expo React Native
├── docs/                 # Documentación vigente
│   └── archive/         # Documentación archivada
├── scripts/              # Scripts de utilidad
├── plans/                # Planes de mejora
├── README.md
├── DIRECTRICES_PROYECTO.md
├── PLAN_DE_TRABAJO_NEXORA.md  ← Este archivo
├── ANALISIS_INTEGRAL_NEXORA_APP.md
├── SESIONES.md
└── API_DOCUMENTATION.md
```

---

## ⚠️ Archivos que NUNCA Eliminar

| Tipo | Ejemplos |
|------|----------|
| Código fuente | `backend/src/`, `frontend/src/` |
| Tests | `*.spec.ts`, `*.test.tsx` |
| Configuración | `package.json`, `tsconfig.json`, `next.config.ts` |
| Raíz crítica | `README.md`, `.gitignore`, `Procfile` |
| Skills | `.agents/skills/` |

---

## 🔧 Comandos Rápidos

```powershell
# Análisis de limpieza
.\.agents\skills\nexora-cleanup\scripts\analizar-limpieza.ps1

# Validación pre-commit
.\.agents\skills\nexora-validation\scripts\pre-commit-check.ps1

# Validación pre-deploy
.\.agents\skills\nexora-validation\scripts\pre-deploy-check.ps1
```

---

**Referencias:** ANALISIS_INTEGRAL_NEXORA_APP.md | nexora-cleanup | nexora-validation
