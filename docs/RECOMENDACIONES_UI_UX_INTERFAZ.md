# Recomendaciones de Mejora UI/UX – Nexora App

**Fecha:** 12 de marzo de 2026  
**Objetivo:** Interfaz más profesional, consistente y estéticamente atractiva

---

## 1. Problemas identificados

### 1.1 Sidebar que se deforma al cambiar de vista

**Causa raíz:** El layout actual usa `flex` sin restricciones de altura. El sidebar (`aside`) no tiene altura fija ni `flex-shrink-0`, por lo que participa en la redistribución del espacio cuando el contenido del área principal cambia de una sección a otra.

**Detalles técnicos:**
- El `aside` tiene `flex-col` pero le falta `flex` como contenedor
- No hay `h-screen` ni `sticky`/`fixed` para fijar el sidebar
- Sin `overflow-y-auto` en el sidebar, muchos ítems de menú pueden generar overflow

### 1.2 Scroll vertical poco funcional

**Causa:** El `main` y el contenedor de contenido no tienen su propia región de scroll. Todo el layout hace scroll como una sola página. Al cambiar de vista (Resumen vs Pedidos vs Agenda, etc.), la altura del contenido varía mucho y el scroll general resulta incómodo.

**Consecuencias:**
- El header y el sidebar desaparecen al hacer scroll
- No hay sensación de “app” sino de página larga
- En vistas con mucho contenido (Agenda, Pedidos) el scroll es poco natural

### 1.3 Inconsistencia visual

- **Clases light en dark mode:** Muchos componentes usan `bg-white`, `text-zinc-900`, `border-gray-200`, etc., pensados para modo claro. Las overrides en `globals.css` con `!important` pueden generar comportamientos raros.
- **ChatSection:** Usa un esquema claro (`bg-white`, `bg-gray-100`) que choca con el resto del dashboard oscuro.
- **Componentes afectados:** ClientsSection, TeamSection, ProductsSection, OrdersSection, AgendaSection, CreateOrderModal, AuditSection, StatsSection, SettingsSection.

---

## 2. Recomendaciones prioritarias

### 2.1 Layout: sidebar fijo y área de contenido con scroll propio

**Objetivo:** Sidebar estable y contenido con scroll independiente.

**Implementación sugerida:**

```
┌─────────────────────────────────────────────────────┐
│ [Sidebar fijo 256px]  │  [Header fijo]              │
│                       ├─────────────────────────────┤
│  - Logo               │                             │
│  - Nav items          │  [Main - overflow-y-auto]  │
│  - Logout             │  Contenido de la sección   │
│                       │  con scroll independiente  │
│  flex-shrink-0        │                             │
│  h-screen             │  min-h-0 para permitir      │
│  overflow-y-auto      │  scroll en flex child      │
└───────────────────────┴─────────────────────────────┘
```

**Cambios en `dashboard/page.tsx`:**

1. Contenedor principal: `flex h-screen overflow-hidden` (o `min-h-screen` con lógica equivalente).
2. Sidebar:
   - `flex flex-col flex-shrink-0 w-64 h-screen overflow-y-auto`
   - `sticky top-0` o estructura con sidebar fija a la izquierda.
3. Columna derecha: `flex flex-1 flex-col min-h-0 overflow-hidden`.
4. Header: `flex-shrink-0`.
5. Main: `flex-1 min-h-0 overflow-y-auto`.

Con esto el sidebar mantiene altura fija y el main tiene scroll propio.

### 2.2 Sidebar como contenedor flex correcto

**Problema:** `aside` usa `flex-col` sin `display: flex`.

**Solución:**

```tsx
// Actual
<aside className="hidden w-64 flex-col border-r ... md:flex">

// Recomendado
<aside className="hidden md:flex flex-col flex-shrink-0 w-64 h-screen overflow-y-auto border-r border-slate-800 bg-slate-950/95 sticky top-0">
```

- `flex` como base del layout.
- `flex-shrink-0` para que no se encoja.
- `h-screen` para altura de ventana.
- `overflow-y-auto` si hay muchos ítems de menú.
- `sticky top-0` para mantenerlo visible.

### 2.3 Unificar paleta en dark mode

**Objetivo:** Eliminar clases de modo claro y usar el sistema de diseño existente.

**Reemplazos recomendados:**

| Clase actual | Reemplazo sugerido |
|--------------|--------------------|
| `bg-white` | `bg-[var(--color-surface-2)]` o `ds-panel` |
| `text-zinc-900` | `text-[var(--color-ink)]` |
| `border-gray-200` | `border-[var(--color-border)]` |
| `bg-gray-50/100` | `bg-[var(--color-surface-3)]` |
| `text-gray-700` | `text-[var(--color-ink-soft)]` |

**Componentes a ajustar:** ClientsSection, TeamSection, ProductsSection, OrdersSection, AgendaSection, CreateOrderModal, AuditSection, StatsSection, SettingsSection, ChatSection, ChatWidget, NotificationsDropdown.

### 2.4 ChatSection: adaptar al dark mode

**Problema:** Fondo blanco y grises claros dentro de un dashboard oscuro.

**Cambios sugeridos:**
- Contenedor: `bg-slate-900/80` en lugar de `bg-white`.
- Sidebar del chat: `bg-slate-800/80`.
- Tabs: colores slate/indigo compatibles con el tema oscuro.
- Evitar `bg-white`, `bg-gray-100` y textos grises claros.

### 2.5 Transiciones entre secciones

**Objetivo:** Reducir “saltos” bruscos al cambiar de vista.

**Opciones:**
- Altura mínima del main: `min-h-[60vh]` para evitar colapsos.
- Animación suave: `transition-opacity` + `animate-in` en el contenido.
- Skeleton loading coherente mientras cambia la sección.

### 2.6 Footer del dashboard

**Problema:** `border-zinc-100 text-zinc-400` en un layout oscuro.

**Solución:**

```tsx
className="border-t border-slate-800 px-4 py-3 text-center text-xs text-slate-500"
```

---

## 3. Mejoras estéticas adicionales

### 3.1 Sidebar

- Separadores suaves entre grupos de ítems (Dashboard, Gestión, Configuración).
- Iconos junto a cada ítem (Lucide React ya está en el proyecto).
- Estado activo más claro (por ejemplo, borde izquierdo o fondo más marcado).
- Espaciado uniforme (`gap-2` entre ítems).

### 3.2 Cards y paneles

- Usar `ds-panel` o `ds-card` de forma consistente.
- Bordes con `var(--color-border)`.
- Sombras sutiles (`var(--shadow-sm)`).

### 3.3 Tablas

- Filas alternadas: `odd:bg-slate-800/30`.
- Hover: `hover:bg-slate-700/30`.
- Bordes con `border-slate-700`.
- Encabezados: `bg-slate-800/80 text-slate-300`.

### 3.4 Formularios

- Inputs con `ds-input`.
- Labels: `text-slate-300`.
- Agrupar campos en secciones con títulos en `text-slate-200`.

### 3.5 Modales

- Fondo: `bg-slate-900/95 backdrop-blur`.
- Contenido: `bg-slate-800` con `border-slate-700`.
- Botones secundarios en tonos slate en lugar de grises claros.

---

## 4. Plan de implementación sugerido

### Fase 1 – Layout (prioridad alta)

1. Ajustar layout del dashboard: sidebar fijo + main con scroll propio.
2. Corregir `aside` del sidebar (flex, altura, overflow).
3. Verificar en móvil que el menú desplegable siga funcionando.

### Fase 2 – Consistencia visual (prioridad alta)

1. Sustituir clases light en componentes del dashboard por variables del sistema de diseño.
2. Adaptar ChatSection al dark mode.
3. Revisar CreateOrderModal y modales de detalle.

### Fase 3 – Polish (prioridad media)

1. Añadir iconos al sidebar.
2. ~~Transiciones suaves entre secciones.~~ ✅ (ds-section-transition en dashboard)
3. Mejorar estado activo y hover en la navegación.
4. Unificar estilos de tablas y formularios.

### Fase 4 – Páginas públicas (prioridad media)

1. Revisar `book/[tenantId]` para coherencia con el resto.
2. Página de login (`app/page.tsx`) ya está alineada con el tema.

---

## 5. Referencias de código

| Archivo | Cambios sugeridos |
|---------|-------------------|
| `app/dashboard/page.tsx` | Layout flex, sidebar fijo, main scrollable |
| `app/globals.css` | Revisar overrides y posible simplificación |
| `components/ChatSection.tsx` | Paleta dark mode |
| `components/ClientsSection.tsx` | Reemplazar `bg-white` por variables |
| `components/TeamSection.tsx` | Idem |
| `components/ProductsSection.tsx` | Idem |
| `components/OrdersSection.tsx` | Idem |
| `components/AgendaSection.tsx` | Idem |
| `components/SettingsSection.tsx` | Idem |
| `components/CreateOrderModal.tsx` | Idem |
| `components/AuditSection.tsx` | Idem |
| `components/StatsSection.tsx` | Idem |

---

## 6. Checklist de verificación

Tras aplicar los cambios:

- [ ] Sidebar mantiene ancho y posición al cambiar de sección
- [ ] Scroll del main es independiente del sidebar
- [ ] Header y sidebar permanecen visibles al hacer scroll del contenido
- [ ] Todas las secciones usan la misma paleta oscura
- [ ] ChatSection se integra visualmente con el dashboard
- [ ] Modales y dropdowns respetan el tema oscuro
- [ ] Tablas y formularios son legibles y coherentes

---

*Documento generado a partir de la revisión de la interfaz de Nexora App.*
