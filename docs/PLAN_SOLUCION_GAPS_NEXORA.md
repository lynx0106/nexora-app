# Plan de Solución — Gaps Identificados en Nexora App

**Fecha:** 12 de marzo de 2026  
**Referencia:** docs/DIAGNOSTICO_FUNCIONALIDADES_NEXORA.md

---

## Resumen Ejecutivo

Este documento plantea la solución a los 5 gaps identificados en el diagnóstico, priorizados por impacto y esfuerzo. Cada ítem incluye: problema, solución propuesta, pasos técnicos y estimación.

---

## Gap 1 — Página post-pago MercadoPago (CRÍTICO)

### Problema
MercadoPago redirige a `/orders/thank-you?orderId=X&status=success` tras el pago, pero esa ruta **no existe**. El cliente recibe 404.

### Solución propuesta

**Opción A (recomendada):** Crear `/orders/thank-you` y pasar el token en la URL de retorno.

1. **Backend:** Modificar `payments.service.ts` para que `createPreference` reciba el `publicToken` y lo incluya en `back_urls`:
   ```
   success: /orders/thank-you?orderId=X&token=Y&status=success
   ```
2. **Backend:** Modificar `orders.service.ts` para pasar el token al llamar `createPreference`.
3. **Frontend:** Crear `app/orders/thank-you/page.tsx` que:
   - Reciba `orderId`, `token`, `status` por query.
   - Si tiene token: redirija a `/orders/status/[orderId]?token=XXX` (reutiliza OrderStatusView).
   - Si no tiene token: muestre mensaje genérico "Gracias por tu compra" y formulario para solicitar enlace por email (opcional fase 2).

**Opción B (mínima):** Solo crear thank-you que muestre mensaje estático "¡Pago recibido!" sin datos del pedido. Menos útil pero evita 404.

### Pasos técnicos (Opción A)

| # | Archivo | Cambio |
|---|---------|--------|
| 1 | `backend/src/payments/payments.service.ts` | Añadir param `publicToken?: string` a `createPreference`, incluir en back_urls |
| 2 | `backend/src/orders/orders.service.ts` | Pasar `token` al llamar `createPreference(savedOrder, tenant, token)` |
| 3 | `frontend/src/app/orders/thank-you/page.tsx` | Nueva página: leer searchParams, redirigir a `/orders/status/[id]?token=` si hay token |
| 4 | `frontend/src/i18n/locales/*.json` | Claves para mensajes thank-you |

### Estimación
**2-3 horas**

---

## Gap 2 — Recuperación de contraseña (Media)

### Problema
Backend tiene `POST /auth/password-reset/request` y `POST /auth/password-reset/confirm`. Mail envía link a `/auth/reset-password?token=X`. El frontend **no tiene** ni el enlace "¿Olvidaste contraseña?" en login ni la página `/auth/reset-password`.

### Solución propuesta

1. **Login (app/page.tsx):** Añadir link "¿Olvidaste tu contraseña?" debajo del campo contraseña, que lleve a `/auth/forgot-password`.
2. **Página solicitar reset:** Crear `/auth/forgot-password` con formulario (solo email) que llame a `POST /auth/password-reset/request`. Mostrar mensaje de éxito "Si el email existe, recibirás un enlace".
3. **Página confirmar reset:** Crear `/auth/reset-password` que reciba `?token=X` por URL. Formulario (nueva contraseña + confirmar) que llame a `POST /auth/password-reset/confirm` con `{ token, newPassword }`. Redirigir a login con mensaje de éxito.

### Pasos técnicos

| # | Archivo | Cambio |
|---|---------|--------|
| 1 | `frontend/src/app/page.tsx` | Añadir `<Link href="/auth/forgot-password">` usando t('auth.forgot_password') |
| 2 | `frontend/src/app/auth/forgot-password/page.tsx` | Nueva: form email, fetch request, toast |
| 3 | `frontend/src/app/auth/reset-password/page.tsx` | Nueva: leer token de query, form newPassword, fetch confirm |
| 4 | `frontend/src/i18n/locales/*.json` | Claves: forgot_password, reset_success, reset_token_invalid, etc. |
| 5 | `backend/src/mail/mail.service.ts` | Verificar que `baseUrl` en reset email sea FRONTEND_URL correcto |

### Estimación
**3-4 horas**

---

## Gap 3 — Push notifications (Media)

### Problema
Módulo `push` existe pero las notificaciones push pueden no llegar por falta de configuración o permisos del usuario.

### Solución propuesta

1. **Verificar backend:** Revisar que `PushService` esté registrado y que el endpoint de suscripción funcione.
2. **Frontend:** Añadir en dashboard (o en NotificationsDropdown) un botón "Activar notificaciones" que:
   - Solicite permiso `Notification.requestPermission()`.
   - Obtenga el `serviceWorkerRegistration` y llame al backend para registrar la suscripción (VAPID keys).
3. **Documentación:** Crear `docs/PUSH_SETUP.md` con pasos para generar VAPID keys, configurar en Railway/Vercel, y probar.

### Pasos técnicos

| # | Archivo | Cambio |
|---|---------|--------|
| 1 | `backend/src/push/` | Revisar que VAPID keys estén en env, endpoint funcional |
| 2 | `frontend/src/components/NotificationsDropdown.tsx` | Botón "Activar notificaciones" si no hay permiso |
| 3 | `frontend/public/sw.js` o similar | Service Worker para push (si no existe) |
| 4 | `docs/PUSH_SETUP.md` | Guía de configuración |

### Estimación
**4-6 horas** (depende de estado actual del módulo push)

---

## Gap 4 — Documentación URLs obsoletas (Baja)

### Problema
Varios documentos referencian `nexora-app-production-3199` cuando la URL actual es `3104`.

### Solución propuesta
Buscar y reemplazar en toda la documentación:
- `3199` → `3104` (o mejor: usar variable/placeholder)
- Revisar `API_DOCUMENTATION.md`, `DIRECTRICES_PROYECTO.md`, etc.

### Pasos técnicos

| # | Acción |
|---|--------|
| 1 | `grep -r "3199" docs/ *.md` para localizar |
| 2 | Reemplazar por `3104` o `nexora-app-production-3104.up.railway.app` |
| 3 | Considerar `.env.example` o `docs/ENV_REFERENCE.md` con URL base documentada |

### Estimación
**1 hora**

---

## Gap 5 — Tests backend fallidos (Baja)

### Problema
Históricamente algunos test suites fallaban (ANALISIS_INTEGRAL). Última ejecución mostró 306 tests pasando; los "errores" en logs son de mocks intencionales. Conviene verificar estado actual.

### Solución propuesta

1. Ejecutar `npm test` en backend y registrar qué suites fallan (si alguno).
2. Corregir fallos de dependencias (unbound-method, mocks incompletos).
3. Subir umbral de cobertura si es posible (objetivo 60%+ en servicios críticos).

### Pasos técnicos

| # | Acción |
|---|--------|
| 1 | `cd backend && npm test -- --run` y documentar fallos |
| 2 | Corregir specs con fallos (app.controller, auth.service tenants mock, etc.) |
| 3 | Revisar `jest.config` umbrales |

### Estimación
**2-3 horas** (variable según fallos)

---

## Cronograma sugerido

| Fase | Tareas | Duración estimada |
|------|--------|-------------------|
| **Fase 1 (Prioridad crítica)** | Gap 1: Thank-you + token en back_urls | 2-3 h |
| **Fase 2 (Prioridad media)** | Gap 2: Recuperación contraseña | 3-4 h |
| **Fase 3 (Prioridad media)** | Gap 3: Push notifications (verificar + doc) | 4-6 h |
| **Fase 4 (Prioridad baja)** | Gap 4: Docs URLs + Gap 5: Tests | 3-4 h |

**Total estimado:** 12-17 horas de desarrollo.

---

## Checklist de verificación post-implementación

- [ ] Cliente que paga con MercadoPago llega a thank-you y ve estado del pedido
- [ ] Usuario puede solicitar reset de contraseña desde login y completar el flujo
- [ ] Push: al menos documento de configuración actualizado
- [x] Documentación sin URLs 3199
- [ ] `npm test` backend sin fallos

---

## Referencias

- `docs/DIAGNOSTICO_FUNCIONALIDADES_NEXORA.md`
- `backend/src/payments/payments.service.ts` (líneas 85-89)
- `backend/src/auth/auth.controller.ts` (password-reset endpoints)
- `backend/src/mail/mail.service.ts` (sendPasswordReset)
