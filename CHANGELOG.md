# Changelog - Nexora App

Todos los cambios relevantes del proyecto se documentan en este archivo.

---

## [Unreleased]

### Added
- Workflow CI (.github/workflows/ci.yml): build + tests backend, build frontend en push/PR
- SESSION_LOG.md para registro técnico de sesiones
- Circuit breaker para OpenAI y MercadoPago (src/common/circuit-breaker)
- Tests tasks.service.spec.ts (TasksService cobertura 100%)
- OrderStatusView como Server Component (orders/status/[id])
- CHANGELOG.md para seguimiento de releases
- Variable `CORS_ORIGINS` en Railway (orígenes específicos, no `*`)
- Tests frontend básicos (login API, dashboard smoke test)
- Lazy loading con `dynamic()` en ChatSection, ChatWidget, SettingsSection, AuditSection
- Uso de `next/image` para logos y productos
- Security headers en Next.js (X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
- Checklists consolidados de deploy (DEPLOY_CHECKLIST.md, DEPLOY_ENVIRONMENT_VARIABLES.md)

### Changed
- CORS: rechaza `*` en producción; usa `CORS_ORIGINS` de env
- Cobertura tests backend: umbrales 60% líneas/statements, exclusiones para migraciones/filters
- AiService y PaymentsService envueltos con circuit breaker
- TYPEORM: `synchronize=false` por defecto en producción
- API_DOCUMENTATION.md y DIRECTRICES_PROYECTO.md con URL correcta (3104)
- `console.log` reemplazados por `Logger` en main.ts y database.config
- `.env.example` actualizado con variables requeridas

### Fixed
- Tests backend: app.controller.spec, users.service.spec, auth.service.spec (294 tests OK)
- Bug en pre-commit-check.ps1 (patrón Select-String)
- CORS preflight OPTIONS respondiendo correctamente

### Security
- CORS restringido a orígenes específicos en producción
- TYPEORM_SYNCHRONIZE=false en Railway
- NODE_ENV=production validado en despliegue

---

## Notas

- Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/)
- Versiones previas no documentadas en este archivo
