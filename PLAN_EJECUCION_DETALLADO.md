# 📅 PLAN DE EJECUCIÓN DETALLADO
## Nexora App - Roadmap de Correcciones Críticas

**Fecha de inicio propuesta:** [Inmediatamente después de aprobación]  
**Duración total estimada:** 8 semanas (40 días hábiles)  
**Equipo:** 1.5 FTE (Full Time Equivalent)

---

## 📊 DIAGRAMA DE GANTT SIMPLIFICADO

```
SEMANA:    [1]     [2]     [3]     [4]     [5]     [6]     [7]     [8]
           ├───────┼───────┼───────┼───────┼───────┼───────┼───────┤
           
FASE 1: SEGURIDAD CRÍTICA 🔴
├─ Cookies httpOnly      [████]
├─ Refresh tokens                [██]
├─ CSRF protection               [██]
├─ Validación archivos           [████]
├─ Rate limiting                         [██]
└─ Logger estructurado                   [████]

FASE 2: ESTABILIDAD 🟡
├─ Manejo de errores                             [██]
├─ Transacciones                                         [██]
└─ Redis config                                                    [████]

FASE 3: ESCALABILIDAD 🟢
├─ Bull Queue                                                        [████]
├─ Circuit Breaker                                                           [████]
└─ Frontend opt                                                              [████]

FASE 4: TESTING 📋
├─ Unit tests                                                                        [████████]
├─ E2E tests                                                                                 [████]
└─ Documentación                                                                             [██]

MILESTONES:
🔷 M1: Security Ready (Fin S2)
🔷 M2: Stability Achieved (Fin S4)
🔷 M3: Scale Ready (Fin S6)
🔷 M4: Quality Release (Fin S8)
```

---

## 🎯 CHECKLIST EJECUTIVO POR FASE

### ✅ FASE 1: SEGURIDAD CRÍTICA (Semanas 1-2)
**Meta:** Eliminar todas las vulnerabilidades críticas

#### Semana 1: Autenticación Segura
- [ ] **LUNES** - Setup de rama `feat/security-overhaul`
  - [ ] Crear rama desde `main`
  - [ ] Configurar environment de desarrollo seguro
  - [ ] Crear PR draft para tracking

- [ ] **MARTES-MIÉRCOLES** - Migración JWT a cookies httpOnly
  - [ ] Backend: Modificar `AuthController.login()` para setear cookie
  - [ ] Backend: Crear interceptor para leer cookie
  - [ ] Backend: Configurar CORS con `credentials: true`
  - [ ] Frontend: Remover `localStorage.getItem('token')`
  - [ ] Frontend: Actualizar `fetchAPIWithAuth` para enviar cookies
  - [ ] Testing: Verificar que el token no es accesible desde JS

- [ ] **JUEVES** - Refresh Token Rotation
  - [ ] Crear entidad `RefreshToken` en base de datos
  - [ ] Implementar endpoint `/auth/refresh`
  - [ ] Implementar rotación (nuevo token en cada uso)
  - [ ] Invalidar tokens usados

- [ ] **VIERNES** - CSRF Protection
  - [ ] Instalar `csurf` o implementar double-submit cookie
  - [ ] Agregar CSRF token a requests mutating
  - [ ] Frontend: Incluir token en headers de POST/PUT/DELETE

#### Semana 2: Validación y Protección
- [ ] **LUNES-MARTES** - Validación de Archivos
  - [ ] Instalar librería `file-type` para magic bytes
  - [ ] Implementar validación de contenido real
  - [ ] Limitar tamaño máximo a 5MB
  - [ ] Agregar scanning antivirus (ClamAV opcional)
  - [ ] Testing: Intentar subir archivo con extensión falsa

- [ ] **MIÉRCOLES** - Sanitización de Logs
  - [ ] Crear servicio `LoggerService` con niveles
  - [ ] Implementar sanitizador de PII (emails, passwords, tokens)
  - [ ] Reemplazar todos los `console.*` en backend
  - [ ] Configurar Sentry para errores 500+

- [ ] **JUEVES** - Rate Limiting
  - [ ] Implementar guard específico para `/auth/login`
  - [ ] Implementar guard específico para `/auth/register`
  - [ ] Agregar bloqueo temporal tras intentos fallidos
  - [ ] Testing: Verificar bloqueo con script de prueba

- [ ] **VIERNES** - Review y Merge
  - [ ] Code review completo
  - [ ] Testing en staging
  - [ ] Merge a `main`
  - [ ] Deploy a producción
  - [ ] **MILESTONE 1: SECURITY READY** 🔷

---

### ✅ FASE 2: ESTABILIDAD Y ROBUSTEZ (Semanas 3-4)
**Meta:** Sistema estable con monitoreo completo

#### Semana 3: Logging y Errores
- [ ] **LUNES** - Logger Estructurado
  - [ ] Definir formato JSON para logs
  - [ ] Agregar correlation ID
  - [ ] Implementar diferentes niveles (debug, info, warn, error)

- [ ] **MARTES** - Manejo de Errores
  - [ ] Crear excepciones de negocio específicas
  - [ ] Estandarizar respuestas de error
  - [ ] Sanitizar mensajes en producción

- [ ] **MIÉRCOLES-JUEVES** - Transacciones
  - [ ] Revisar `OrdersService.create()`
  - [ ] Implementar patrón Outbox para emails
  - [ ] Agregar manejo de concurrencia optimista

- [ ] **VIERNES** - Sentry y Alertas
  - [ ] Configurar Sentry en backend
  - [ ] Configurar Sentry en frontend
  - [ ] Crear alertas para errores críticos
  - [ ] Testing: Generar error y verificar en Sentry

#### Semana 4: Redis y Caché
- [ ] **LUNES** - Setup Redis
  - [ ] Crear cuenta en Upstash (o local)
  - [ ] Configurar cliente Redis en NestJS
  - [ ] Implementar health check

- [ ] **MARTES-MIÉRCOLES** - Caché de Tenant
  - [ ] Cachear datos de tenant por 5 minutos
  - [ ] Invalidar caché en actualizaciones
  - [ ] Testing: Verificar reducción de queries

- [ ] **JUEVES** - Rate Limiting Distribuido
  - [ ] Migrar rate limiting a Redis
  - [ ] Verificar funciona con múltiples instancias

- [ ] **VIERNES** - Session Store
  - [ ] Implementar store de sesiones en Redis
  - [ ] Testing: Login/logout con Redis
  - [ ] **MILESTONE 2: STABILITY ACHIEVED** 🔷

---

### ✅ FASE 3: ESCALABILIDAD (Semanas 5-6)
**Meta:** Sistema preparado para crecimiento

#### Semana 5: Message Queue y Circuit Breakers
- [ ] **LUNES** - Bull Queue Setup
  - [ ] Instalar Bull y Bull Board
  - [ ] Configurar dashboard de monitoreo
  - [ ] Crear primera queue de prueba

- [ ] **MARTES-MIÉRCOLES** - Procesamiento Async
  - [ ] Mover envío de emails a queue
  - [ ] Mover notificaciones push a queue
  - [ ] Implementar retry con backoff exponencial
  - [ ] Testing: Verificar procesamiento en background

- [ ] **JUEVES-VIERNES** - Circuit Breakers
  - [ ] Implementar para OpenAI
  - [ ] Implementar para MercadoPago
  - [ ] Testing: Simular fallo y verificar fallback

#### Semana 6: Frontend Optimization
- [ ] **LUNES-MARTES** - Server Components
  - [ ] Refactorizar dashboard page
  - [ ] Extraer componentes de servidor
  - [ ] Mantener solo interactividad necesaria en cliente

- [ ] **MIÉRCOLES** - ISR y Caché
  - [ ] Implementar ISR en páginas públicas
  - [ ] Configurar revalidación por demanda
  - [ ] Testing: Verificar cache hit

- [ ] **JUEVES-VIERNES** - Accesibilidad
  - [ ] Agregar atributos ARIA
  - [ ] Implementar navegación por teclado
  - [ ] Verificar contraste de colores
  - [ ] **MILESTONE 3: SCALE READY** 🔷

---

### ✅ FASE 4: TESTING Y CALIDAD (Semanas 7-8)
**Meta:** Cobertura del 70% y tests E2E funcionando

#### Semana 7: Testing Backend
- [ ] **LUNES-MARTES** - Unit Tests Críticos
  - [ ] AuthService: 70% cobertura
  - [ ] OrdersService: 70% cobertura
  - [ ] PaymentsService: 70% cobertura

- [ ] **MIÉRCOLES-JUEVES** - Integration Tests
  - [ ] Flujo completo de autenticación
  - [ ] Creación de pedido con pago
  - [ ] Webhook de MercadoPago

- [ ] **VIERNES** - Testing Mobile
  - [ ] Configurar testing environment
  - [ ] Tests de AuthContext
  - [ ] Tests de API client

#### Semana 8: E2E y Documentación
- [ ] **LUNES-MARTES** - Playwright E2E
  - [ ] Setup Playwright
  - [ ] Test: Registro de usuario
  - [ ] Test: Login y navegación
  - [ ] Test: Crear pedido completo
  - [ ] Test: Flujo de pago

- [ ] **MIÉRCOLES** - Documentación
  - [ ] Actualizar README con nuevas variables de entorno
  - [ ] Documentar arquitectura de seguridad
  - [ ] Guía de troubleshooting

- [ ] **JUEVES** - QA y Bug Fixes
  - [ ] Testing manual completo
  - [ ] Bug fixes priorizados
  - [ ] Performance testing básico

- [ ] **VIERNES** - Release
  - [ ] Deploy final a producción
  - [ ] Monitoreo de métricas
  - [ ] Post-mortem y celebración
  - [ ] **MILESTONE 4: QUALITY RELEASE** 🔷

---

## 🔧 SCRIPTS DE APOYO

### Script: Verificar Vulnerabilidades (Semana 1)
```bash
#!/bin/bash
# security-check.sh

echo "🔍 Verificando seguridad..."

# 1. Buscar console.log en backend
echo "1. Buscando console.* en backend..."
if grep -r "console\." backend/src --include="*.ts" | grep -v "node_modules" | grep -v ".spec.ts"; then
  echo "❌ ERROR: console.* encontrado en código de producción"
  exit 1
fi
echo "✅ OK: No hay console.* en backend"

# 2. Verificar que no hay localStorage.getItem('token')
echo "2. Verificando almacenamiento de token..."
if grep -r "localStorage.*token" frontend/src --include="*.ts" --include="*.tsx"; then
  echo "❌ ERROR: Token aún en localStorage"
  exit 1
fi
echo "✅ OK: Token no está en localStorage"

# 3. Verificar rate limiting
echo "3. Verificando rate limiting..."
if ! grep -r "@Throttle" backend/src/auth --include="*.ts"; then
  echo "⚠️  WARNING: No hay rate limiting específico en auth"
fi

echo "✅ Verificación completa"
```

---

## 📈 MÉTRICAS DIARIAS

Durante la ejecución, trackear:

| Métrica | Herramienta | Frecuencia |
|---------|-------------|------------|
| Cobertura de tests | Jest | Diaria |
| Errores en Sentry | Sentry | Diaria |
| Tiempo de build | CI/CD | Por commit |
| Vulnerabilidades | npm audit | Semanal |
| Lighthouse score | Lighthouse CI | Semanal |

---

## 🚨 PROTOCOLO DE EMERGENCIA

### Si se encuentra una vulnerabilidad crítica durante el desarrollo:

1. **STOP** - Detener trabajo en nuevas features
2. **ASSESS** - Evaluar severidad (CVSS)
3. **ISOLATE** - Crear hotfix branch desde producción
4. **FIX** - Implementar corrección mínima
5. **TEST** - Testing rápido
6. **DEPLOY** - Deploy inmediato a producción
7. **COMMUNICATE** - Notificar stakeholders
8. **DOCUMENT** - Post-mortem

---

## 📝 TEMPLATE DE COMMITS

```
[SECTOR] tipo: descripción corta

- Detalle de cambios
- Referencias a tareas

Refs: #1.1.1
```

**Sectores:**
- `[SEC]` - Seguridad
- `[STB]` - Estabilidad
- `[SCL]` - Escalabilidad
- `[TST]` - Testing
- `[DOC]` - Documentación

**Tipos:**
- `feat` - Nueva funcionalidad
- `fix` - Corrección de bug
- `refactor` - Refactorización
- `test` - Testing
- `docs` - Documentación

**Ejemplo:**
```
[SEC] feat: migrar JWT a cookies httpOnly

- Implementa cookies httpOnly en AuthController
- Agrega CSRF protection
- Actualiza frontend para usar cookies
- Remueve localStorage de token

Refs: #1.1.1, #1.1.3
```

---

## ✅ CHECKLIST FINAL PRE-RELEASE

Antes de considerar completada cada fase, verificar:

### Pre-Fase 1
- [ ] Backup de base de datos producción
- [ ] Environment de staging configurado
- [ ] Rollback plan documentado
- [ ] Equipo notificado de cambios

### Pre-Fase 2
- [ ] Fase 1 estable en producción por 48h
- [ ] Métricas de seguridad monitoreadas
- [ ] No hay regressions reportadas

### Pre-Fase 3
- [ ] Redis provisionado y configurado
- [ ] Monitoreo de colas configurado
- [ ] Plan de capacidad definido

### Pre-Fase 4
- [ ] Cobertura actual > 50%
- [ ] Performance baseline establecido
- [ ] Equipo de QA listo

### Pre-Release Final
- [ ] Todos los tests pasan
- [ ] Security audit externo (opcional pero recomendado)
- [ ] Documentación completa
- [ ] Training de equipo de soporte
- [ ] Plan de comunicación a usuarios

---

## 🎉 DEFINICIÓN DE ÉXITO

El proyecto se considera **EXITOSO** cuando:

1. **Todas las fases completadas** según timeline
2. **Security Score >= 90/100** en auditoría externa
3. **Cobertura de tests >= 70%**
4. **Uptime de 99.9%** durante 2 semanas consecutivas
5. **Tiempo de respuesta p95 < 200ms**
6. **Zero vulnerabilidades críticas** en scan automatizado
7. **Equipo capacitado** en nuevas prácticas de seguridad

---

**Documento creado:** 23 de febrero de 2026  
**Última actualización:** 23 de febrero de 2026  
**Próxima revisión:** Semanal durante ejecución

**Aprobaciones necesarias:**
- [ ] Tech Lead
- [ ] Security Officer
- [ ] Product Owner
