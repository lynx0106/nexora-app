# Especificación — Landing, Planes y Onboarding (Nexora)

**Fecha:** 12 de marzo de 2026  
**Base:** Nexora App SaaS multi-tenant  
**Objetivo:** Landing de conversión con planes, gráficos comparativos y onboarding guiado por rol, **respetando íntegramente el branding actual**.

---

## 1. Branding Obligatorio (NO modificar)

Toda la landing, planes y onboarding **deben** usar el sistema de diseño existente. No se introducirán colores, fuentes ni assets nuevos.

### 1.1 Variables CSS (`frontend/src/app/globals.css`)

| Variable | Valor (dark) | Uso |
|----------|-------------|-----|
| `--color-ink` | `#f1f5f9` | Texto principal |
| `--color-ink-soft` | `#94a3b8` | Texto secundario |
| `--color-muted` | `#64748b` | Texto muted |
| `--color-border` | `#334155` | Bordes |
| `--color-surface` | `#0f172a` | Fondo principal (slate-900) |
| `--color-surface-2` | `#1e293b` | Fondo secundario (slate-800) |
| `--color-surface-3` | `#334155` | Inputs (slate-700) |
| `--color-bg` | `#0a0f1c` | Fondo base |
| `--color-accent` | `#14b8a6` | Acento principal (teal) |
| `--color-accent-2` | `#0d9488` | Acento secundario |
| `--color-glow-1` | `rgba(20, 184, 166, 0.15)` | Glow turquesa |
| `--color-glow-2` | `rgba(59, 130, 246, 0.12)` | Glow azul |
| `--color-warning` | `#fbbf24` | Estados warning |
| `--color-danger` | `#f87171` | Estados error |
| `--color-success` | `#34d399` | Estados éxito |
| `--radius-sm` | `10px` | Radios |
| `--radius-md` | `16px` | |
| `--radius-lg` | `24px` | |
| `--shadow-sm/md/lg` | Ver globals.css | Sombras |

### 1.2 Tipografía

| Variable | Fuente | Uso |
|----------|--------|-----|
| `--font-sans` | **Space Grotesk** (Google Fonts) | Cuerpo, UI |
| `--font-display` | **Fraunces** (Google Fonts) | Títulos, display |

Importar vía `layout.tsx`:

```ts
Space_Grotesk({ variable: "--font-sans", subsets: ["latin"], display: "swap" })
Fraunces({ variable: "--font-display", subsets: ["latin"], display: "swap" })
```

### 1.3 Assets

| Asset | Ruta | Uso |
|-------|------|-----|
| Logo principal | `/logo-fondo.png` | Header, hero, onboarding |
| Favicon | `/favicon.ico` | Pestaña navegador |
| Icon | `app/icon.png` (Next.js) | PWA, OG |

**Regla:** Logos en alto contraste (tonos dorados/vibrantes sobre oscuro). No aplicar filtros que los aclaren o desaturen.

### 1.4 Clases de diseño (`ds-*`)

Usar siempre en lugar de Tailwind ad-hoc:

- Contenedores: `ds-card`, `ds-panel`
- Botones: `ds-button`, `ds-button-primary`, `ds-button-ghost`
- Inputs: `ds-input`
- Texto: `ds-text`, `ds-soft`, `ds-muted`
- Selección: `ds-choice`, `ds-choice-active`
- Alertas: `ds-alert-error`, `ds-alert-success`
- Toast: `ds-toast-layer`, `ds-toast`
- Animaciones: `ds-page`, `ds-section-transition`, `ds-fade-up`

### 1.5 Fondo base

```css
background:
  radial-gradient(1200px 600px at 10% -10%, var(--color-glow-1) 0%, transparent 55%),
  radial-gradient(1000px 480px at 90% 0%, var(--color-glow-2) 0%, transparent 60%),
  var(--color-bg);
```

---

## 2. Estructura de la Landing

**Ruta:** `/` (página principal sin login)  
**Comportamiento:** Si el usuario está autenticado → redirect a `/dashboard`. Si no → mostrar landing.

### 2.1 Secciones (orden)

| # | Sección | Contenido |
|---|---------|-----------|
| 1 | **Header** | Logo `/logo-fondo.png`, navegación (Features, Planes, FAQ), Login, CTA "Empezar gratis" |
| 2 | **Hero** | Headline "El núcleo inteligente de tu negocio", subtitle, CTA principal y secundario |
| 3 | **Features** | Grid de 6–8 features (Productos, Pedidos, Agenda, Chat, IA, Pagos, Automatizaciones, Auditoría) con iconos |
| 4 | **Planes** | 3 cards: Starter, Pro, Enterprise (tabla comparativa debajo) |
| 5 | **Comparativa** | Tabla detallada por plan (tenants, usuarios, funcionalidades) |
| 6 | **App Móvil** | Destacado: "Nexora también en tu celular", QR para descargar APK, guía de instalación paso a paso (no técnica) |
| 7 | **Social Proof** | Placeholder para testimonios, logos de sectores (restaurantes, salud, retail) |
| 8 | **FAQ** | Acordeón con preguntas frecuentes (incluir "¿Cómo instalo la app en mi celular?") |
| 9 | **Footer** | Logo, links legales, contacto, redes |

### 2.2 CTA y Navegación

- "Empezar gratis" → `/` (formulario de registro inline o modal)
- "Iniciar sesión" → `/` (toggle login/registro existente en `page.tsx`)
- En el hero: mismo comportamiento, manteniendo la UX actual de login/registro por perfil

---

## 3. Planes de Ventas

### 3.1 Definición de Planes

| Plan | Precio (ejemplo) | Tenants | Usuarios | Características diferenciadoras |
|------|------------------|---------|----------|---------------------------------|
| **Starter** | $29/mes | 1 | Hasta 3 | Productos, Pedidos, Agenda básica, sin IA |
| **Pro** | $79/mes | 3 | Hasta 15 | Todo Starter + Chat, IA, MercadoPago, automatizaciones |
| **Enterprise** | Contacto | Ilimitados | Ilimitados | Todo Pro + Auditoría avanzada, API, soporte dedicado |

### 3.2 Tabla Comparativa (gráfico)

| Funcionalidad | Starter | Pro | Enterprise |
|---------------|:-------:|:---:|:----------:|
| Tenants | 1 | 3 | ∞ |
| Usuarios | 3 | 15 | ∞ |
| Productos/Catálogo | ✅ | ✅ | ✅ |
| Pedidos | ✅ | ✅ | ✅ |
| Agenda/Citas | ✅ | ✅ | ✅ |
| Chat en tiempo real | — | ✅ | ✅ |
| IA conversacional | — | ✅ | ✅ |
| MercadoPago | — | ✅ | ✅ |
| Automatizaciones | — | ✅ | ✅ |
| Auditoría avanzada | — | — | ✅ |
| API / integraciones | — | — | ✅ |
| Soporte dedicado | — | — | ✅ |

### 3.3 Visualización en la Landing

- **Cards de plan:** `ds-card` con borde `var(--color-border)`, acento en el plan recomendado (borde `var(--color-accent)`).
- Precio: `ds-text`, fuente display para números.
- Badge "Popular" en Pro: `ds-alert-success` suave o variante sutil.
- Botones: `ds-button-primary` para CTA de registro.

---

## 4. App Móvil (Landing)

### 4.1 Objetivo

Mencionar la app Android en la landing y permitir descargarla mediante QR + link, con una guía **muy amigable** para usuarios no técnicos sobre cómo instalar un APK.

### 4.2 Sección "Nexora en tu celular"

**Ubicación:** Entre Planes y Social Proof (sección dedicada).

**Contenido:**
- Headline: "Gestiona tu negocio desde cualquier lugar"
- Subtexto: "Descarga la app Nexora en tu celular Android y accede a pedidos, agenda y chat al instante."
- **QR:** Código QR que apunta a la URL de descarga del APK (o a una página intermedia con instrucciones).
- **Botón:** "Descargar app" (enlace directo al APK).
- **Collapsible/Modal:** "¿Cómo instalo la app?" con guía paso a paso.

### 4.3 Guía de instalación APK (lenguaje no técnico)

Texto orientado a usuarios que **nunca** han instalado una app fuera de Play Store:

| Paso | Título | Texto / Instrucción |
|------|--------|---------------------|
| 1 | **Abre el enlace** | "Toca el botón 'Descargar app' o escanea el código QR con la cámara de tu celular." |
| 2 | **Permite la descarga** | "Tu celular descargará un archivo. Si te pregunta si deseas descargar, toca 'Aceptar' o 'Descargar'." |
| 3 | **Activa la instalación** | "Android puede mostrar un mensaje como 'Apps de fuentes desconocidas'. Toca 'Configuración' y activa 'Permitir desde este navegador' (o Chrome). Así Android sabe que confías en esta descarga." |
| 4 | **Instala la app** | "Cuando termine la descarga, toca 'Abrir' o busca el archivo en tu carpeta 'Descargas'. Toca el archivo y luego 'Instalar'." |
| 5 | **¡Listo!** | "Cuando termine, verás el ícono de Nexora en tu celular. Abre la app e inicia sesión con tu cuenta." |

**Notas de implementación:**
- Usar iconos o ilustraciones simples en cada paso.
- Evitar términos como "APK", "sideloading", "fuentes desconocidas" en los títulos; si aparecen, explicarlos entre paréntesis.
- Incluir aviso: "La app Nexora es segura. Solo descárgala desde este sitio oficial."

### 4.4 URL del APK

- **Variable de entorno sugerida:** `NEXT_PUBLIC_APP_APK_URL` (URL pública del APK).
- Los artefactos de EAS Build expiran; para producción se recomienda:
  - Hospedar el APK en un CDN/Storage (Railway, Supabase Storage, Cloudflare R2) y actualizar la URL tras cada build, **o**
  - Usar un enlace corto que redirija al artefacto EAS más reciente (requiere lógica servidor/API).
- El QR se genera con la misma URL (librería `react-qr-code` ya en el proyecto, usada en InviteManager).

### 4.5 Diseño

- Card `ds-card` con ícono de smartphone (Lucide: `Smartphone`).
- QR centrado, tamaño mínimo ~180x180px para escaneo fácil.
- Botón `ds-button-primary`: "Descargar app para Android".
- Acordeón "¿Cómo instalo la app?" con estilos `ds-panel` y tipografía `ds-text` / `ds-muted`.

---

## 5. Gráficos y Diagramas

### 5.1 Diagrama por Rol

Representar flujos de onboarding según el rol del usuario:

```
[Registro] → [¿Rol?] → Admin → [Onboarding Admin: Crear tenant, configurar, invitar equipo]
                    → User  → [Onboarding User: Ver dashboard, explorar secciones]
                    → Client→ [Onboarding Client: Ver pedidos, reservas]
```

### 5.2 Gráfico de Crecimiento (opcional)

- Barras por día/semana de ventas (alineado con `StatsSection` existente).
- Usar librería existente si hay (Recharts u otra). Colores: `var(--color-accent)`, `var(--color-surface-2)`.

### 5.3 Iconografía

- Lucide React (ya usado en el proyecto): `Store`, `Calendar`, `MessageCircle`, `Bot`, `CreditCard`, `Settings`, `FileText`, etc.
- Mismo tamaño y estilo que en el dashboard.

---

## 6. Onboarding Guiado (User-Friendly para No Técnicos)

**Principio:** El onboarding debe ser lo más amigable posible. Los usuarios no son técnicos; el lenguaje debe ser claro, cercano y evitar jerga. Un solo paso a la vez, mensajes positivos y opción de saltar sin perder acceso a la ayuda.

### 6.1 Reglas de Diseño para Usuarios No Técnicos

| Regla | Cómo implementarlo |
|-------|-------------------|
| **Lenguaje simple** | Evitar: "Configurar tenant", "RLS", "API". Usar: "Datos de tu negocio", "Tu tienda", "Conectar con otras apps" |
| **Un paso a la vez** | Mostrar solo un paso por pantalla. No abrumar con formularios largos |
| **Mensajes positivos** | "¡Muy bien!", "Solo un paso más", "Estás listo para empezar" |
| **Iconos descriptivos** | Cada paso con un ícono grande y claro (Lucide) |
| **Poder saltar** | Botón "Omitir por ahora" visible pero no destacado. Al cerrar: "¿Necesitas ayuda más tarde? Busca 'Ver guía' en el menú" |
| **Progreso visible** | Indicador "Paso 2 de 4" o barra de progreso. Transmite que es corto |
| **Reabrir ayuda** | En el dashboard: enlace "¿Primera vez? Ver guía" o ícono de ayuda en header |

### 6.2 Flujo General

1. Usuario completa registro (o login si invitado).
2. Si es **primera vez** (`onboardingCompleted === false`): mostrar wizard guiado.
3. Wizard según `role` del usuario.
4. Persistir en backend para no repetir en otros dispositivos.

### 6.3 Onboarding Admin (dueño de negocio)

| Paso | Título amigable | Contenido | Tono |
|------|-----------------|-----------|------|
| 1 | ¡Bienvenido! | "Vamos a configurar tu negocio en pocos minutos. Es muy fácil." + ícono celebración | Cálido |
| 2 | ¿Cómo se llama tu negocio? | Input: nombre. "Así tus clientes verán tu negocio cuando reserven o compren." | Explicativo |
| 3 | ¿A qué te dedicas? | Selector sencillo: Restaurante, Tienda, Consultorio, Spa, Otro | Simple |
| 4 | Tu logo (opcional) | "¿Tienes un logo? Puedes subirlo aquí. Si no, lo haremos después." Botón "Omitir" visible | Opcional |
| 5 | Invita a tu equipo | "¿Quieres que alguien más gestione el negocio? Envíale un enlace de invitación por correo." Botón "Hacerlo después" | Flexible |
| 6 | ¡Todo listo! | "Ya puedes ver tu panel. Aquí gestionarás pedidos, citas y más. ¡Empecemos!" CTA "Ver mi panel" | Motivador |

### 6.4 Onboarding User / Doctor / Support (empleados)

| Paso | Título amigable | Contenido |
|------|-----------------|-----------|
| 1 | ¡Tu cuenta está lista! | "Tu jefe te ha dado acceso. Aquí verás los pedidos, la agenda y el chat." |
| 2 | Un recorrido rápido | Tour por elementos: "Aquí están los pedidos", "Aquí la agenda del día", "Aquí el chat con clientes". O bien: un panel con 3 íconos y descripciones cortas |
| 3 | Ir al panel | CTA "Entrar al panel" |

### 6.5 Onboarding Client

| Paso | Contenido |
|------|-----------|
| 1 | "¡Hola! Aquí puedes ver tus pedidos y reservas." |
| 2 | Enlace a la página del negocio (si existe): "También puedes reservar o comprar desde la página de [Nombre del negocio]" |
| 3 | CTA "Ver mis pedidos" o "Cerrar" |

### 6.6 Persistencia

- Campo en `users`: `onboardingCompleted: boolean` (o tabla `user_onboarding` con `step`, `role`).
- Tras completar wizard: `onboardingCompleted = true`.
- No volver a mostrar el wizard en sesiones futuras.
- Opción para reabrir la guía desde el dashboard ("¿Necesitas ayuda? Ver guía").

---

## 7. Rutas y URLs

| Ruta | Descripción |
|------|-------------|
| `/` | Landing + Login/Registro (actual `page.tsx` extendido o split) |
| `/landing` | (Opcional) Landing pura sin formularios; CTA a `/` |
| `/dashboard` | Dashboard (requiere auth) |
| `/book/[tenantId]` | Página pública de reservas/tienda |
| `/orders/status/[id]` | Estado de pedido (token) |

**Recomendación:** Mantener `/` como punto de entrada. La landing puede ser un layout que muestre:
- **No autenticado:** Hero + secciones + formulario login/registro (existente).
- **Autenticado:** Redirect a `/dashboard`.

---

## 8. Implementación Sugerida

### 8.1 Fases

| Fase | Alcance |
|------|---------|
| **Fase 1** | Landing básica: Header, Hero, Features, Planes (cards + tabla), Footer. Reutilizar `page.tsx` o crear `app/(marketing)/page.tsx`. |
| **Fase 2** | Sección App Móvil: QR, botón descarga, guía de instalación APK (colapsable). Social proof placeholder, FAQ acordeón (incluir "¿Cómo instalo la app?"). |
| **Fase 3** | Onboarding wizard amigable por rol (lenguaje no técnico, un paso a la vez), persistencia en backend. |
| **Fase 4** | Gráficos (diagrama por rol, opcionalmente gráfico de ventas en hero). |

### 8.2 Componentes Nuevos (sugeridos)

```
frontend/src/
├── app/
│   ├── (marketing)/           # Grupo de rutas para landing
│   │   ├── layout.tsx         # Layout sin sidebar, solo header/footer
│   │   └── page.tsx           # Landing completa
│   └── onboarding/
│       └── page.tsx           # Wizard de onboarding
├── components/
│   ├── landing/
│   │   ├── LandingHeader.tsx
│   │   ├── LandingHero.tsx
│   │   ├── LandingFeatures.tsx
│   │   ├── LandingPlans.tsx
│   │   ├── LandingComparison.tsx
│   │   ├── LandingAppMobile.tsx       # QR + guía instalación APK
│   │   ├── LandingFAQ.tsx
│   │   └── LandingFooter.tsx
│   └── onboarding/
│       ├── OnboardingWizard.tsx
│       └── OnboardingStep*.tsx
```

### 8.3 Reglas de Implementación

1. **Solo** variables CSS de `globals.css` y clases `ds-*`.
2. **Solo** fuentes Space Grotesk y Fraunces.
3. Logo: `/logo-fondo.png` en header y hero.
4. Dark mode por defecto (`html.dark` en `layout.tsx`).
5. i18n: todas las cadenas en `frontend/src/i18n/locales/*.json`.
6. Responsive: grid/flex con breakpoints estándar (sm, md, lg).

---

## 9. Referencias de Código

- **Login/Registro actual:** `frontend/src/app/page.tsx`
- **Variables CSS:** `frontend/src/app/globals.css`
- **Layout y fuentes:** `frontend/src/app/layout.tsx`
- **Dashboard sidebar/logo:** `frontend/src/app/dashboard/page.tsx` (línea ~348)
- **Página book (estilo público):** `frontend/src/app/book/[tenantId]/page.tsx`
- **Diagnóstico de funcionalidades:** `docs/DIAGNOSTICO_FUNCIONALIDADES_NEXORA.md`
- **Tema móvil (consistencia):** `nexora-mobile/src/theme/index.ts`

---

## 10. Checklist Pre-Implementación

- [ ] Confirmar que `logo-fondo.png` existe en `frontend/public/`
- [ ] Definir precios finales y límites por plan (backend)
- [ ] Decidir si la landing reemplaza `page.tsx` o coexiste en grupo `(marketing)`
- [ ] Añadir campos `onboardingCompleted` / tabla onboarding si no existen
- [ ] Crear claves i18n para todos los textos de landing, onboarding y app móvil
- [ ] Configurar `NEXT_PUBLIC_APP_APK_URL` (URL pública del APK; EAS artifacts expiran; considerar CDN/Storage)

---

*Documento vivo. Actualizar al implementar cada fase.*
