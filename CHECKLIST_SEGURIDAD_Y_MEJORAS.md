# 📋 CHECKLIST DE SEGURIDAD Y MEJORAS - NEXORA APP

**Documento de Acción Correctiva**  
**Versión:** 1.0  
**Fecha:** 23 de febrero de 2026  
**Clasificación:** CRÍTICO - PRIORIDAD MÁXIMA  

---

## 🎯 OBJETIVO

Implementar correcciones de seguridad críticas y mejoras arquitectónicas para alcanzar un nivel de madurez APTO PARA PRODUCCIÓN EMPRESARIAL, eliminando vulnerabilidades críticas y estableciendo bases sólidas para escalabilidad.

**Estado Objetivo:** 90/100 (Actual: 71/100)  
**Timeline Estimado:** 6-8 semanas  
**Recursos Requeridos:** 1 Developer Senior Full Stack + 1 DevOps (parcial)

---

## 🚨 SECCIÓN 1: VULNERABILIDADES CRÍTICAS (BLOQUEANTES)

> **⚠️ ADVERTENCIA:** Estas tareas DEBEN completarse antes de cualquier escalamiento de usuarios o producción masiva. Representan riesgos de seguridad inaceptables.

### 1.1 Autenticación y Sesiones

| # | Tarea | Severidad | Estimación | Estado |
|---|-------|-----------|------------|--------|
| 1.1.1 | Migrar almacenamiento JWT de localStorage a cookies httpOnly | 🔴 CRÍTICO | 8h | ⬜ PENDIENTE |
| 1.1.2 | Implementar refresh token rotation | 🔴 CRÍTICO | 6h | ⬜ PENDIENTE |
| 1.1.3 | Agregar protección CSRF para cookies | 🔴 CRÍTICO | 4h | ⬜ PENDIENTE |
| 1.1.4 | Implementar invalidación de sesiones en logout | 🔴 CRÍTICO | 3h | ⬜ PENDIENTE |
| 1.1.5 | Agregar endpoint `/auth/me` para obtener datos de usuario | 🟡 ALTO | 2h | ⬜ PENDIENTE |

**Criterios de Aceptación:**
- [ ] El token JWT no es accesible desde JavaScript del frontend
- [ ] Las cookies tienen flags: `httpOnly`, `secure`, `sameSite=strict`
- [ ] El refresh token rota en cada uso
- [ ] Las sesiones se invalidan correctamente en logout

**Archivos a Modificar:**
```
backend/src/auth/auth.controller.ts
backend/src/auth/auth.service.ts
backend/src/auth/jwt.strategy.ts
frontend/src/lib/api.ts
frontend/src/app/dashboard/page.tsx
```

---

### 1.2 Validación y Sanitización

| # | Tarea | Severidad | Estimación | Estado |
|---|-------|-----------|------------|--------|
| 1.2.1 | Implementar validación de archivos por magic bytes | 🔴 CRÍTICO | 6h | ⬜ PENDIENTE |
| 1.2.2 | Limitar tamaño máximo de uploads (5MB) | 🔴 CRÍTICO | 2h | ⬜ PENDIENTE |
| 1.2.3 | Sanitizar logs para evitar exposición de PII | 🔴 CRÍTICO | 4h | ⬜ PENDIENTE |
| 1.2.4 | Remover contraseñas hardcodeadas en seed | 🔴 CRÍTICO | 2h | ⬜ PENDIENTE |
| 1.2.5 | Implementar helmet con CSP estricto | 🟡 ALTO | 3h | ⬜ PENDIENTE |

**Criterios de Aceptación:**
- [ ] Los archivos se validan por contenido, no solo por extensión/mimetype
- [ ] No hay contraseñas en código fuente (usar variables de entorno)
- [ ] Los logs no contienen emails, contraseñas, ni tokens
- [ ] CSP headers bloquean inline scripts no autorizados

**Archivos a Modificar:**
```
backend/src/uploads/uploads.controller.ts
backend/src/common/filters/http-exception.filter.ts
backend/src/audit/audit.interceptor.ts
backend/src/users/users.service.ts
backend/src/main.ts
```

---

### 1.3 Rate Limiting y Protección

| # | Tarea | Severidad | Estimación | Estado |
|---|-------|-----------|------------|--------|
| 1.3.1 | Implementar rate limiting específico para `/auth/login` | 🔴 CRÍTICO | 3h | ⬜ PENDIENTE |
| 1.3.2 | Implementar rate limiting para `/auth/register` | 🔴 CRÍTICO | 2h | ⬜ PENDIENTE |
| 1.3.3 | Agregar protección contra brute force (bloqueo temporal) | 🟡 ALTO | 4h | ⬜ PENDIENTE |
| 1.3.4 | Implementar rate limiting por IP + usuario combinado | 🟡 ALTO | 3h | ⬜ PENDIENTE |

**Criterios de Aceptación:**
- [ ] Login: máximo 5 intentos por minuto por IP
- [ ] Register: máximo 3 intentos por hora por IP
- [ ] Bloqueo temporal de 15 min tras 5 intentos fallidos
- [ ] Headers `Retry-After` en respuestas 429

**Archivos a Modificar:**
```
backend/src/auth/auth.controller.ts
backend/src/app.module.ts
backend/src/common/guards/throttle.guard.ts (nuevo)
```

---

## 🔧 SECCIÓN 2: ESTABILIDAD Y ROBUSTEZ (ALTA PRIORIDAD)

> Estas tareas mejoran la confiabilidad del sistema y previenen caídas en producción.

### 2.1 Logging y Observabilidad

| # | Tarea | Prioridad | Estimación | Estado |
|---|-------|-----------|------------|--------|
| 2.1.1 | Crear servicio de logger estructurado | 🟡 ALTO | 4h | ⬜ PENDIENTE |
| 2.1.2 | Reemplazar todos los `console.*` por logger | 🟡 ALTO | 6h | ⬜ PENDIENTE |
| 2.1.3 | Implementar niveles de log (debug, info, warn, error) | 🟡 ALTO | 2h | ⬜ PENDIENTE |
| 2.1.4 | Agregar correlación de request IDs en todos los logs | 🟡 ALTO | 3h | ⬜ PENDIENTE |
| 2.1.5 | Configurar Sentry para errores en producción | 🟡 ALTO | 3h | ⬜ PENDIENTE |

**Criterios de Aceptación:**
- [ ] No hay ningún `console.log/error/warn` en código de producción
- [ ] Todos los logs incluyen timestamp, level, requestId, tenantId
- [ ] Logs de error incluyen stack trace
- [ ] Sentry reporta errores 500 automáticamente

**Archivos a Modificar:**
```
backend/src/common/logger/logger.service.ts (nuevo)
backend/src/**/*.ts (todos los que usen console)
backend/src/config/sentry.config.ts
```

---

### 2.2 Manejo de Errores

| # | Tarea | Prioridad | Estimación | Estado |
|---|-------|-----------|------------|--------|
| 2.2.1 | Estandarizar excepciones (usar siempre HttpException) | 🟡 ALTO | 4h | ⬜ PENDIENTE |
| 2.2.2 | Crear excepciones de negocio específicas | 🟡 ALTO | 3h | ⬜ PENDIENTE |
| 2.2.3 | Sanitizar mensajes de error en producción | 🟡 ALTO | 2h | ⬜ PENDIENTE |
| 2.2.4 | Implementar graceful shutdown | 🟡 ALTO | 3h | ⬜ PENDIENTE |

**Criterios de Aceptación:**
- [ ] Todos los errores son instancias de HttpException o BusinessException
- [ ] En producción, los errores 500 muestran mensaje genérico
- [ ] El servidor cierra conexiones activas antes de terminar

**Archivos a Modificar:**
```
backend/src/common/exceptions/
backend/src/common/filters/http-exception.filter.ts
backend/src/main.ts
```

---

### 2.3 Transacciones y Consistencia

| # | Tarea | Prioridad | Estimación | Estado |
|---|-------|-----------|------------|--------|
| 2.3.1 | Revisar transacciones anidadas en OrdersService | 🟡 ALTO | 4h | ⬜ PENDIENTE |
| 2.3.2 | Implementar patrón Outbox para operaciones async | 🟡 ALTO | 8h | ⬜ PENDIENTE |
| 2.3.3 | Agregar manejo de concurrencia optimista | 🟡 ALTO | 4h | ⬜ PENDIENTE |

**Criterios de Aceptación:**
- [ ] Las operaciones de pedido son atómicas
- [ ] Los eventos async (emails) usan patrón outbox
- [ ] Versionado de entidades para detectar conflictos

---

## 🏗️ SECCIÓN 3: ARQUITECTURA Y ESCALABILIDAD (MEDIA PRIORIDAD)

### 3.1 Implementar Redis

| # | Tarea | Prioridad | Estimación | Estado |
|---|-------|-----------|------------|--------|
| 3.1.1 | Configurar cliente Redis (Upstash/local) | 🟢 MEDIO | 3h | ⬜ PENDIENTE |
| 3.1.2 | Implementar caché para datos de tenant | 🟢 MEDIO | 4h | ⬜ PENDIENTE |
| 3.1.3 | Usar Redis para rate limiting distribuido | 🟢 MEDIO | 3h | ⬜ PENDIENTE |
| 3.1.4 | Implementar caché de sesiones | 🟢 MEDIO | 3h | ⬜ PENDIENTE |

**Criterios de Aceptación:**
- [ ] Redis conectado y operativo
- [ ] Datos de tenant cacheados por 5 minutos
- [ ] Rate limiting funciona con múltiples instancias

**Archivos a Modificar:**
```
backend/src/config/redis.config.ts (nuevo)
backend/src/tenants/tenants.service.ts
backend/src/common/guards/throttle.guard.ts
```

---

### 3.2 Message Queue (Bull)

| # | Tarea | Prioridad | Estimación | Estado |
|---|-------|-----------|------------|--------|
| 3.2.1 | Configurar Bull Queue con Redis | 🟢 MEDIO | 4h | ⬜ PENDIENTE |
| 3.2.2 | Crear queue para envío de emails | 🟢 MEDIO | 3h | ⬜ PENDIENTE |
| 3.2.3 | Crear queue para notificaciones push | 🟢 MEDIO | 3h | ⬜ PENDIENTE |
| 3.2.4 | Implementar retry con backoff exponencial | 🟢 MEDIO | 4h | ⬜ PENDIENTE |

**Criterios de Aceptación:**
- [ ] Emails se encolan y procesan async
- [ ] Dashboard de Bull Board accesible para admins
- [ ] Reintentos automáticos hasta 3 veces

**Archivos a Modificar:**
```
backend/src/queue/queue.module.ts (nuevo)
backend/src/mail/mail.processor.ts (nuevo)
backend/src/notifications/notification.processor.ts (nuevo)
```

---

### 3.3 Circuit Breaker

| # | Tarea | Prioridad | Estimación | Estado |
|---|-------|-----------|------------|--------|
| 3.3.1 | Implementar Circuit Breaker para OpenAI | 🟢 MEDIO | 4h | ⬜ PENDIENTE |
| 3.3.2 | Implementar Circuit Breaker para MercadoPago | 🟢 MEDIO | 4h | ⬜ PENDIENTE |
| 3.3.3 | Implementar fallback cuando servicios externos fallan | 🟢 MEDIO | 3h | ⬜ PENDIENTE |

**Criterios de Aceptación:**
- [ ] Después de 5 fallos, el circuito se abre
- [ ] Respuesta de fallback clara para el usuario
- [ ] Recuperación automática tras 30 segundos

---

## 🎨 SECCIÓN 4: FRONTEND Y UX (MEDIA PRIORIDAD)

### 4.1 Optimización Next.js

| # | Tarea | Prioridad | Estimación | Estado |
|---|-------|-----------|------------|--------|
| 4.1.1 | Refactorizar dashboard a Server Components | 🟢 MEDIO | 12h | ⬜ PENDIENTE |
| 4.1.2 | Implementar ISR para páginas públicas | 🟢 MEDIO | 4h | ⬜ PENDIENTE |
| 4.1.3 | Agregar metadata dinámica por página | 🟢 MEDIO | 3h | ⬜ PENDIENTE |
| 4.1.4 | Optimizar imágenes con next/image | 🟢 MEDIO | 2h | ⬜ PENDIENTE |

**Criterios de Aceptación:**
- [ ] Solo componentes interactivos usan "use client"
- [ ] Páginas públicas usan ISR con revalidación
- [ ] Lighthouse score > 90 en Performance

---

### 4.2 Accesibilidad

| # | Tarea | Prioridad | Estimación | Estado |
|---|-------|-----------|------------|--------|
| 4.2.1 | Agregar atributos ARIA a componentes interactivos | 🟢 MEDIO | 4h | ⬜ PENDIENTE |
| 4.2.2 | Implementar navegación por teclado | 🟢 MEDIO | 3h | ⬜ PENDIENTE |
| 4.2.3 | Agregar skip links | 🟢 MEDIO | 1h | ⬜ PENDIENTE |
| 4.2.4 | Verificar contraste de colores (WCAG AA) | 🟢 MEDIO | 2h | ⬜ PENDIENTE |

---

## 🧪 SECCIÓN 5: TESTING (ALTA PRIORIDAD PARA MANTENIBILIDAD)

### 5.1 Testing Backend

| # | Tarea | Prioridad | Estimación | Estado |
|---|-------|-----------|------------|--------|
| 5.1.1 | Alcanzar 70% cobertura en AuthService | 🟡 ALTO | 8h | ⬜ PENDIENTE |
| 5.1.2 | Alcanzar 70% cobertura en OrdersService | 🟡 ALTO | 10h | ⬜ PENDIENTE |
| 5.1.3 | Alcanzar 70% cobertura en PaymentsService | 🟡 ALTO | 8h | ⬜ PENDIENTE |
| 5.1.4 | Crear tests de integración para flujos críticos | 🟡 ALTO | 12h | ⬜ PENDIENTE |
| 5.1.5 | Configurar tests E2E con Playwright | 🟢 MEDIO | 8h | ⬜ PENDIENTE |

**Criterios de Aceptación:**
- [ ] Cobertura global >= 70%
- [ ] Tests de integración para: login, crear pedido, pago
- [ ] Tests E2E para flujo completo de compra

---

## 📱 SECCIÓN 6: APP MÓVIL (BAJA PRIORIDAD)

### 6.1 Mejoras Mobile

| # | Tarea | Prioridad | Estimación | Estado |
|---|-------|-----------|------------|--------|
| 6.1.1 | Configurar variables de entorno para API URL | 🟢 MEDIO | 2h | ⬜ PENDIENTE |
| 6.1.2 | Implementar caché offline | 🟢 BAJO | 8h | ⬜ PENDIENTE |
| 6.1.3 | Agregar validación de inputs con Zod | 🟢 BAJO | 4h | ⬜ PENDIENTE |
| 6.1.4 | Implementar sync offline | 🔵 MUY BAJO | 12h | ⬜ PENDIENTE |

---

## 📅 PLAN DE IMPLEMENTACIÓN

### FASE 1: FUNDAMENTOS DE SEGURIDAD (Semana 1-2)
**Objetivo:** Eliminar vulnerabilidades críticas

```
DÍA 1-2:  [1.1.1] Migrar JWT a cookies httpOnly
DÍA 3:    [1.1.2] Implementar refresh token rotation
DÍA 4:    [1.1.3] Agregar protección CSRF
DÍA 5:    [1.2.1] Validación de archivos por magic bytes

SEMANA 2:
LUN: [1.2.2] Limitar tamaño de uploads
MAR: [1.2.3] Sanitizar logs PII
MIE: [1.2.4] Remover contraseñas hardcodeadas
JUE: [1.3.1-1.3.2] Rate limiting específico
VIE: [2.1.1-2.1.2] Logger estructurado
```

**Milestone:** Security Audit Pass - Score 85/100

---

### FASE 2: ESTABILIDAD Y ROBUSTEZ (Semana 3-4)
**Objetivo:** Sistema estable y observable

```
SEMANA 3:
LUN-MAR: [2.1.3-2.1.5] Completar logging + Sentry
MIE-JUE: [2.2.1-2.2.4] Estandarizar errores
VIE:     [2.3.1] Revisar transacciones Orders

SEMANA 4:
LUN-MIE: [3.1.1-3.1.4] Implementar Redis
JUE-VIE: [3.2.1-3.2.4] Configurar Bull Queue
```

**Milestone:** Stability Release - Uptime 99.9%

---

### FASE 3: ESCALABILIDAD (Semana 5-6)
**Objetivo:** Preparar para crecimiento

```
SEMANA 5:
LUN-MAR: [3.3.1-3.3.3] Circuit Breakers
MIE-JUE: [2.3.2] Patrón Outbox
VIE:     [3.2.4] Retry con backoff

SEMANA 6:
LUN-MIE: [4.1.1-4.1.4] Optimizar Next.js
JUE-VIE: [4.2.1-4.2.4] Accesibilidad
```

**Milestone:** Scale Ready - Soporte 10,000 usuarios concurrentes

---

### FASE 4: CALIDAD Y TESTING (Semana 7-8)
**Objetivo:** Cobertura de testing completa

```
SEMANA 7:
LUN-MIE: [5.1.1-5.1.3] Testing unitario servicios críticos
JUE-VIE: [5.1.4] Tests de integración

SEMANA 8:
LUN-MAR: [5.1.5] Tests E2E con Playwright
MIE:     [6.1.1-6.1.2] Mejoras mobile básicas
JUE-VIE: Buffer / Bug fixes / Documentación
```

**Milestone:** Quality Release - 70% cobertura, tests verdes

---

## 👥 ASIGNACIÓN DE RESPONSABILIDADES

### Developer Senior Full Stack
- Secciones 1.1, 1.2, 1.3 (Seguridad crítica)
- Sección 2 (Estabilidad)
- Sección 4 (Frontend)
- Sección 5 (Testing)

### DevOps / Backend Specialist (50% dedicación)
- Sección 3.1 (Redis)
- Sección 3.2 (Bull Queue)
- Sección 3.3 (Circuit Breaker)
- Configuración de infraestructura
- Monitoreo y alertas

### Mobile Developer (por demanda)
- Sección 6 (Mejoras mobile)
- Soporte de testing en dispositivos

---

## ✅ DEFINICIÓN DE "HECHO" (Definition of Done)

Para cada tarea, se considera **COMPLETADA** cuando:

1. **Código:**
   - [ ] Código implementado y commiteado
   - [ ] Code review aprobado
   - [ ] Sin console.log ni debugging code
   - [ ] Tipado TypeScript estricto

2. **Testing:**
   - [ ] Tests unitarios pasan
   - [ ] Tests de integración pasan (si aplica)
   - [ ] Cobertura no disminuye
   - [ ] Testing manual realizado

3. **Documentación:**
   - [ ] README actualizado (si aplica)
   - [ ] Changelog actualizado
   - [ ] API docs actualizadas (Swagger)

4. **Despliegue:**
   - [ ] Funciona en staging
   - [ ] Variables de entorno configuradas en prod
   - [ ] Rollback plan documentado

---

## 🔄 PROCESO DE REVISIÓN

### Daily Standup (15 min)
- ¿Qué hice ayer?
- ¿Qué haré hoy?
- ¿Bloqueos?

### Revisión Semanal (1 hora)
- Demo de tareas completadas
- Revisión de checklist
- Ajuste de timeline si es necesario

### Retrospectiva por Fase (2 horas)
- ¿Qué funcionó bien?
- ¿Qué podemos mejorar?
- Acciones para la siguiente fase

---

## 📊 MÉTRICAS DE ÉXITO

| Métrica | Antes | Objetivo | Después |
|---------|-------|----------|---------|
| Security Score | 72/100 | 90/100 | __/100 |
| Cobertura Tests | 15% | 70% | __% |
| Uptime | N/A | 99.9% | __% |
| Tiempo respuesta API (p95) | N/A | < 200ms | __ms |
| Errores 500/semana | N/A | < 5 | __ |
| Lighthouse Performance | N/A | > 90 | __ |

---

## 🚨 ESCALACIÓN Y CONTACTOS

| Rol | Responsabilidad | Contacto |
|-----|-----------------|----------|
| Tech Lead | Decisiones técnicas arquitectónicas | [Por definir] |
| Product Owner | Priorización de funcionalidades | [Por definir] |
| Security Officer | Aprobación de seguridad | [Por definir] |
| DevOps | Infraestructura y despliegue | [Por definir] |

---

## 📝 NOTAS Y COMENTARIOS

### Consideraciones Importantes

1. **Orden de implementación:**
   - NUNCA saltar la Fase 1. Las vulnerabilidades de seguridad son bloqueantes.
   - Las fases 2 y 3 pueden ejecutarse en paralelo si hay suficientes recursos.
   - La Fase 4 es crítica para mantenibilidad a largo plazo.

2. **Riesgos Identificados:**
   - **Riesgo:** El cambio a cookies httpOnly puede romper integración mobile
   - **Mitigación:** Mantener compatibilidad con headers Authorization durante transición
   
   - **Riesgo:** Redis agrega complejidad operativa
   - **Mitigación:** Usar servicio gestionado (Upstash) para reducir overhead

3. **Dependencias Externas:**
   - Upstash Redis (cuenta y API key)
   - Sentry DSN
   - Variables de entorno adicionales

4. **Rollback Strategy:**
   - Cada feature debe poder desactivarse vía feature flag
   - Base de datos: mantener migraciones reversibles
   - Frontend: despliegue gradual (Vercel)

---

**Documento aprobado por:**

| Nombre | Rol | Firma | Fecha |
|--------|-----|-------|-------|
| | Tech Lead | | |
| | Product Owner | | |
| | Security Officer | | |

---

*"La seguridad no es un producto, es un proceso."* — Bruce Schneier

**Próxima revisión del documento:** [Fecha + 1 semana]
