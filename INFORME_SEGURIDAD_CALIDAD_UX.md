# Informe de Seguridad, Calidad y UX - Nexora App

**Fecha:** 12 de marzo de 2026  
**URL analizada:** https://nexora-app.online  
**Última actualización:** 12 mar 2026 — mejoras P0/P1 implementadas

---

## 1. Seguridad (npm audit)

### Backend
| Estado | Cantidad |
|--------|----------|
| **Total vulnerabilidades** | 8 (moderado, tras `npm audit fix`) |
| Moderado | 8 |

**Paquetes afectados (fix requiere `npm audit fix --force` = breaking):**
- `ajv` (ReDoS) — @nestjs/schematics (solo dev, no producción)
- `file-type` — bucle infinito en parser ASF — @nestjs/common
- `multer` — DoS por recurso
- `serialize-javascript` — posible RCE
- `liquidjs` — path traversal
- `minimatch`, `glob`, `html-minifier` — varias dependencias de NestJS/Mailer

**Fix aplicado:** `npm audit fix` — mitigó algunas (file-type, liquidjs, mailparser, multer, minimatch, serialize-javascript). Las restantes requieren `--force` (breaking changes).

### Frontend
| Estado | Cantidad |
|--------|----------|
| **Total** | 5 (tras fix) |
| Bajo | 4 |
| Alto | 1 (Next.js) |

**Pendiente:**
- **Next.js** (15.6-16.1.4): DoS Image Optimizer, deserialización, consumo de memoria. Fix: `npm audit fix --force` → Next 16.1.6
- `@tootallnate/once` (jest-environment-jsdom): breaking change

---

## 2. Calidad de Código (ESLint)

### Backend
- **~150+ errores/warnings** en múltiples archivos
- **Tipos principales:**
  - `@typescript-eslint/no-unused-vars` — imports/variables no usados
  - `@typescript-eslint/no-unsafe-member-access` — acceso a `any`
  - `@typescript-eslint/no-unsafe-assignment` — asignación desde `any`
  - `@typescript-eslint/unbound-method` — métodos sin bind

**Archivos con más incidencias:** appointments.controller.ts, ai.service.ts, app.controller.ts

### Frontend
- **~50+ errores/warnings**
- **Tipos principales:**
  - `@next/next/no-img-element` — usar `next/image` en book/[tenantId]
  - `jsx-a11y/alt-text` — imágenes sin `alt`
  - `react-hooks/set-state-in-effect` — setState síncrono en useEffect (configuracion, dashboard)
  - `@typescript-eslint/no-explicit-any` — tipos `any` explícitos
  - `react-hooks/exhaustive-deps` — dependencias faltantes en useEffect

---

## 3. UI/UX (Lighthouse)

| Categoría | Puntuación | Estado |
|-----------|------------|--------|
| **Performance** | 87/100 | Bueno |
| **Accessibility** | 90/100 | Bueno |
| **Best Practices** | 100/100 | Excelente |
| **SEO** | 100/100 | Excelente |

**Métricas Core Web Vitals:**
- First Contentful Paint: 2.0 s (83)
- Largest Contentful Paint: 3.7 s (59) — mejorable
- Speed Index: 2.9 s (95)

**Nota:** Redirección de nexora-app.online → www.nexora-app.online detectada.

---

## 4. Sugerencias de Mejora (Priorizadas)

### P0 — Crítico (1-2 semanas)
1. ✅ **Next.js:** Actualizar a 16.1.6+ para parches de seguridad — **HECHO**
2. ✅ **Multer/Platform-Express:** NestJS 11.1.16 incluye fix multer DoS — **HECHO** (package.json ya tenía ^11.1.16)
3. ✅ **Imágenes:** Sustituir `<img>` por `next/image` en `book/[tenantId]/page.tsx` — **HECHO**

### P1 — Importante (2-4 semanas)
4. ✅ **ESLint backend:** Tipar Request/Reply (evitar `any` en `req.user`) — **HECHO** (AuthUser, express.d.ts, push/notifications)
5. ✅ **useEffect/setState:** Refactorizar dashboard y configuracion — **HECHO** (useSyncExternalStore, queueMicrotask)
6. ✅ **LCP:** Reducir Largest Contentful Paint — **HECHO** (font display:swap, priority en logo, img→Image en todos)
7. **npm audit --force:** Evaluar actualizaciones breaking para backend (NestJS schematics, csurf, mailer)

### P2 — Mejora (1-3 meses)
8. ✅ **Accesibilidad:** Añadir `alt` a todas las imágenes — **HECHO** (img→Image con alt descriptivos)
9. ✅ **TypeScript estricto:** Reducir uso de `any` — **HECHO** (interfaces, err:unknown, tenants, shippingAddress)
10. ✅ **Dependencias backend:** Reemplazo @nestjs-modules/mailer — **HECHO** (nodemailer + handlebars directos, eliminadas 210 dependencias y 33 vulnerabilidades)

---

## 5. Resumen Ejecutivo

| Área | Estado | Acción prioritaria |
|------|--------|--------------------|
| Seguridad | ⚠️ | Actualizar Next.js, revisar dependencias backend |
| Calidad código | ⚠️ | Tipar controllers, refactorizar effects |
| UX/Performance | ✅ | LCP mejorable, resto en buen nivel |
| Accesibilidad | ✅ | 90/100, añadir alts |
| Best Practices | ✅ | 100/100 |
| SEO | ✅ | 100/100 |

---

*Generado automáticamente. Ejecutar `npm audit`, `npm run lint` y Lighthouse periódicamente.*
