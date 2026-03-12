# Plan de Actualización – npm audit

**Fecha:** 12 de marzo de 2026  
**Estado:** Pendientes requieren cambios breaking o decisiones de arquitectura

---

## Resumen actual

| Proyecto  | Vulnerabilidades | Severidad         | Fix sin breaking |
|-----------|------------------|-------------------|------------------|
| Backend   | 8                | 8 moderate        | csurf eliminado  |
| Frontend  | 4                | 4 low             | ❌ Ninguno       |

---

## Backend – Detalle de vulnerabilidades

### 1. ajv (ReDoS) – 8 moderate

**Cadena:** `@nestjs/cli` → `@nestjs/schematics` → `@angular-devkit/core` → `ajv`  
**Advisory:** [GHSA-2g4f-4pwh-qvx6](https://github.com/advisories/GHSA-2g4f-4pwh-qvx6)  
**Impacto:** ReDoS al usar opción `$data` en schemas JSON.

**Contexto:** Solo afecta al **CLI de NestJS** (`nest generate`, `nest new`), no al runtime de la aplicación.

**Opciones:**

| Opción | Acción | Riesgo |
|--------|--------|--------|
| A | No actuar | Bajo. Solo afecta desarrollo local. |
| B | `npm audit fix --force` | Instala `@nestjs/cli@7.6.0` (downgrade mayor). Puede romper generadores y scripts. |
| C | Esperar NestJS 12 | Mantener estado actual hasta nueva versión. |

**Recomendación:** Opción A. No afecta producción.

---

### 2. ~~cookie (caracteres fuera de límites) – 1 low~~ – RESUELTO

**Cadena:** ~~`csurf` → `cookie`~~  
**Acción tomada:** Eliminado `csurf` y `@types/csurf` (no se usaban).

---

### 3. file-type (bucle infinito en ASF) – 1 moderate

**Cadena:** `@nestjs/common` → `file-type` (nested)  
**Advisory:** [GHSA-5v7r-6r5c-r473](https://github.com/advisories/GHSA-5v7r-6r5c-r473)  
**Impacto:** Bucle infinito con input ASF malformado.

**Contexto:** NestJS incluye su propia copia de `file-type`. El proyecto tiene además `file-type@21.3.1` como dependencia directa (actualizado a 21.3.1).

**Opciones:**

| Opción | Acción | Riesgo |
|--------|--------|--------|
| A | Esperar actualización de NestJS | Riesgo moderate; mitigable limitando tipos de archivo en uploads. |
| B | `npm audit fix --force` | Instalaría `@nestjs/common@11.0.15` (downgrade respecto a 11.1.16). No recomendado. |

**Recomendación:** Opción A. Validar tipos de archivo en uploads (magic numbers, extensión).

---

## Frontend – Detalle de vulnerabilidades

### 4. @tootallnate/once (Control Flow) – 4 low

**Cadena:** `jest-environment-jsdom` → `jsdom` → `http-proxy-agent` → `@tootallnate/once`  
**Advisory:** [GHSA-vpq2-c234-7xj6](https://github.com/advisories/GHSA-vpq2-c234-7xj6)

**Contexto:** Afecta solo al entorno de **tests** (jest-environment-jsdom), no al bundle de producción.

**Opciones:**

| Opción | Acción | Riesgo |
|--------|--------|--------|
| A | No actuar | Bajo. Impacto limitado a tests locales. |
| B | `npm install jest-environment-jsdom@30.3.0` | Requiere Jest 30. Cambios: matchers (`toBeCalled`→`toHaveBeenCalled`), Node 18+, TypeScript 5.4+. |

**Recomendación:** Opción A de momento. Planificar migración a Jest 30 en sprint dedicado.

---

## Acciones aplicadas (12 mar 2026)

- [x] Actualizar `file-type` directo a `^21.3.1` en backend (mitigación parcial).
- [x] Eliminar `csurf` y `@types/csurf` (dependencia no usada) – redujo 2 vulnerabilidades.
- [x] Crear este plan de actualización.

---

## Acciones recomendadas

### Inmediatas (bajo riesgo)

1. ~~**Eliminar csurf del backend**~~ – **HECHO** (12 mar 2026).

### Corto plazo (1–2 sprints)

2. **Validación de uploads:** Revisar `uploads.controller` y asegurar validación por magic numbers y tipos permitidos.

3. **Seguimiento de NestJS:** Revisar si NestJS 11.1.x o 12 incluye `file-type` actualizado.

### Medio plazo (cuando haya tiempo)

4. **Migración a Jest 30:** En una rama aparte, probar `jest@30` y `jest-environment-jsdom@30` con los cambios descritos en la [guía de Jest 30](https://jestjs.io/docs/upgrading-to-jest30).

---

## Comandos de verificación

```bash
# Backend
cd backend && npm audit

# Frontend  
cd frontend && npm audit
```

---

*Documento generado tras auditoría de seguridad de Nexora App.*
