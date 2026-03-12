# Informe de Tests: Seguridad, Usabilidad y UI/UX – Nexora App

**Fecha:** 12 de marzo de 2026  
**Alcance:** Auditoría integral para garantizar funcionamiento sin problemas ni visualizaciones inconsistentes

---

## 1. Resumen ejecutivo

| Área | Estado | Prioridad |
|------|--------|-----------|
| **Seguridad** | ⚠️ Mejorado | Correcciones P0 aplicadas |
| **Tests automatizados** | ✅ Pasando | 309 tests (backend + frontend) |
| **Usabilidad** | ⚠️ Mejorable | Sustituir `alert()` por toast |
| **UI/UX** | ✅ Correcto | Dark mode, CSS vars, consistencia |
| **Dependencias** | ⚠️ Revisar | npm audit con vulnerabilidades |

---

## 2. Seguridad

### 2.1 Correcciones aplicadas (P0)

1. **Contraseña temporal hardcodeada – CORREGIDO**
   - **Antes:** `AgendaSection` y `CreateOrderModal` usaban `TempPassword123!` para todos los clientes creados.
   - **Riesgo:** Contraseña universal expuesta en el bundle; cualquiera podría usarla en cualquier cuenta cliente.
   - **Solución:** Endpoint `/users` admite `generateTempPassword: true`; el backend genera una contraseña aleatoria segura y la devuelve solo en la respuesta de creación.
   - **Archivos modificados:**
     - `backend/src/users/dto/create-user.dto.ts` – Campo opcional `generateTempPassword`
     - `backend/src/users/users.controller.ts` – Generación de contraseña con `crypto.randomBytes`
     - `frontend/src/components/AgendaSection.tsx` – Uso de `generateTempPassword` y `showToast`
     - `frontend/src/components/CreateOrderModal.tsx` – Uso de `generateTempPassword`

2. **Fallback inseguro en backend – CORREGIDO**
   - **Antes:** `body.password || 'TempPass123!'` en el controller.
   - **Ahora:** Si no se envía contraseña, se genera una aleatoria; no se usa fallback hardcodeado.

### 2.2 Configuración de seguridad verificada

| Elemento | Estado | Detalle |
|----------|--------|---------|
| CORS | ✅ | Whitelist explícita, sin `*` en producción |
| JWT | ✅ | Secret desde `process.env.JWT_SECRET` |
| Helmet | ✅ | CSP, X-Frame-Options, etc. |
| ValidationPipe | ✅ | whitelist, forbidNonWhitelisted |
| Errores 500 | ✅ | Mensaje genérico en producción |
| Headers Next.js | ✅ | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy |

### 2.3 Pendientes de seguridad

- **Scripts legacy y de desarrollo:** Contraseñas hardcodeadas en `backend/scripts/legacy/`, `simulate-chat-flow.ts`, `verify-and-create-users.ts`, etc. Son scripts de local/ci, no de producción; conviene documentar que no deben usarse en producción.
- **users-init.controller:** Contraseña por defecto `NexoraTemp2026!` para superadmin – solo en entorno de inicialización, documentar.
- **npm audit backend:** Vulnerabilidades moderadas en `@nestjs/cli`, `ajv` (ReDoS). Evaluar `npm audit fix --force` para actualizar dependencias.
- **npm audit frontend:** Vulnerabilidad baja en `@tootallnate/once` (jest-environment-jsdom). Bajo impacto.

---

## 3. Tests automatizados

### Backend (NestJS)

```
Test Suites: 24 passed, 24 total
Tests:       306 passed, 306 total
```

**Nota:** Hay logs de error durante los tests (MailService, TasksService, StorageService, etc.); son esperados porque se simulan fallos intencionadamente.

**Warning:** `A worker process has failed to exit gracefully` – posible fuga de timers/handles. Útil ejecutar con `--detectOpenHandles` para localizarla.

### Frontend (Next.js + Jest)

```
Test Suites: 2 passed, 2 total
Tests:       3 passed, 3 total
```

**Cobertura actual:** Limitada en frontend (solo `api.test.ts` y `app/page.test.tsx`). Se recomienda aumentar tests en componentes críticos (formularios, flujos de pago, chat).

---

## 4. Usabilidad y UX

### 4.1 Uso de `alert()` en lugar de toast

En la plataforma existe `showToast()` (evento `nexora:toast`), pero varios componentes siguen usando `alert()`:

| Componente | Usos de alert() | Recomendación |
|------------|-----------------|---------------|
| AgendaSection | 6 | Sustituir por `showToast` |
| CreateOrderModal | 3 | Sustituir por `showToast` |
| OrdersSection | 3 | Sustituir por `showToast` |
| ProductsSection | 4 | Sustituir por `showToast` |
| ClientsSection | 1 | Sustituir por `showToast` |
| ChatWidget | 3 | Sustituir por `showToast` |
| TeamSection | 1 | Sustituir por `showToast` |
| book/[tenantId]/page | 2 | Sustituir por `showToast` |

**Motivo:** Los `alert()` bloquean la UI y dan peor experiencia de uso. Los toasts son no bloqueantes y encajan con el diseño actual.

**Acción:** Migrar todos estos usos a `showToast()` con el tipo apropiado (`success` / `error` / `info`).

### 4.2 Validación de formularios

- **Backend:** DTOs con class-validator (`IsEmail`, `MinLength`, etc.) – correcto.
- **Frontend:** No hay validación previa al submit en varios formularios; los errores llegan tras el fallo del backend. Se recomienda validación básica en cliente (email, campos obligatorios) para mejorar feedback inmediato.

---

## 5. UI/UX y consistencia visual

### 5.1 Sistema de diseño

- **Paleta:** Variables CSS coherentes (`--color-ink`, `--color-surface`, `--color-accent`, etc.).
- **Dark mode:** Por defecto (`className="dark"` en `layout.tsx`).
- **Fuentes:** Space Grotesk (sans), Fraunces (display).
- **Fondos:** Gradientes radiales con `--color-glow-1`, `--color-glow-2`.

### 5.2 Responsividad y accesibilidad

- Según el informe previo: Lighthouse Accessibility 90/100.
- Headers de seguridad configurados en `next.config.ts`.
- Imágenes migradas a `next/image` donde corresponde.

### 5.3 Posibles inconsistencias

- Revisar que todos los botones usen las clases `.btn-primary`, `.btn-secondary` o equivalentes.
- Verificar contraste de textos en modo oscuro.
- Revisar que no haya `img` sin `alt`.

---

## 6. Checklist de acciones recomendadas

### P0 – Crítico (ya aplicado)

- [x] Eliminar contraseñas hardcodeadas en frontend (AgendaSection, CreateOrderModal).
- [x] Generar contraseñas temporales en backend con `crypto.randomBytes`.

### P1 – Importante (1–2 semanas)

- [ ] Sustituir `alert()` por `showToast()` en los 8 componentes indicados.
- [ ] Revisar y ejecutar `npm audit` (backend y frontend); planificar actualizaciones con `--force` si es necesario.
- [ ] Ejecutar `--detectOpenHandles` en los tests del backend para localizar fugas de handles.
- [ ] Añadir validación básica en formularios críticos (login, registro, creación de pedidos).

### P2 – Mejora (1–3 meses)

- [x] Aumentar cobertura de tests en frontend – **HECHO** (25 tests en 7 suites).
- [x] Validación básica en formularios críticos – **HECHO** (login, registro, book, store, CreateOrderModal).
- [ ] Documentar scripts con credenciales de desarrollo y marcar como no aptos para producción.
- [ ] Ejecutar Lighthouse periódicamente para mantener métricas de performance y accesibilidad.

---

## 7. Scripts de validación disponibles

```powershell
# Pre-commit (rápido)
.agents/skills/nexora-validation/scripts/pre-commit-check.ps1

# Pre-deploy (completo)
.agents/skills/nexora-validation/scripts/pre-deploy-check.ps1

# Validar CORS (si hay problemas de conexión)
.agents/skills/nexora-validation/scripts/validate-cors.ps1
```

---

## 8. Conclusión

La plataforma está en buen estado funcional: los tests pasan y las correcciones de seguridad críticas han sido aplicadas. Las mejoras pendientes se centran en:

1. Sustituir `alert()` por `showToast()` para una experiencia más fluida.
2. Gestionar vulnerabilidades de dependencias con `npm audit`.
3. Ampliar tests del frontend.
4. Refinar validación en formularios.

El uso de contraseñas temporales generadas en backend elimina el riesgo de una contraseña universal conocida y mejora la seguridad del flujo de creación de clientes.

---

*Generado como parte de la auditoría de seguridad, usabilidad y UI/UX de Nexora App.*
