# 📋 ROLES Y PERMISOS - NEXORA APP

## Roles de Usuario Existentes

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| **superadmin** | Administrador de toda la plataforma | Total |
| **admin** | Administrador de un tenant (empresa) | Completo dentro de su tenant |
| **user** | Usuario/Empleado de un tenant | Limitado según configuración |
| **client** | Cliente externo | Acceso público/restringido |

---

## 🔐 VISIBILIDAD POR ROL

### SUPERADMIN (Administrador de Plataforma)

El superadmin puede ver y gestionar **TODOS** los tenants y usuarios de la plataforma.

| Sección | Visible | Descripción |
|---------|---------|-------------|
| Dashboard/Resumen | ✅ | Métricas globales de todos los tenants |
| Empresas | ✅ | Lista de todos los tenants |
| Usuarios | ✅ | Usuarios de todos los tenants |
| Clientes | ✅ | Clientes de todos los tenants |
| Catálogo | ✅ | Productos de todos los tenants |
| Pedidos | ✅ | Pedidos de todos los tenants |
| Agenda | ✅ | Citas de todos los tenants |
| Reservas | ✅ | Reservas de restaurantes |
| Mensajes | ✅ | Chat de todos los tenants |
| Invitaciones | ✅ | Gestión de invitaciones |
| Usuarios Globales | ✅ | Todos los usuarios del sistema |
| Auditoría | ✅ | Logs de auditoría globales |
| Configuración | ✅ | Configuración global |

---

### ADMIN (Administrador de Empresa)

El admin tiene acceso completo **dentro de su tenant** únicamente.

| Sección | Visible | Descripción |
|---------|---------|-------------|
| Dashboard/Resumen | ✅ | Métricas de su empresa |
| Equipo/Usuarios | ✅ | Usuarios de su empresa |
| Clientes | ✅ | Clientes de su empresa |
| Catálogo | ✅ | Productos/Servicios de su empresa |
| Pedidos | ✅ | Pedidos de su empresa |
| Agenda | ✅ | Citas de su empresa |
| Reservas | ✅ | Solo si es restaurante |
| Mensajes | ✅ | Chat de su empresa |
| Invitaciones | ✅ | Crear invitaciones |
| Usuarios Globales | ❌ | No tiene acceso |
| Auditoría | ❌ | No tiene acceso |
| Configuración | ✅ | Configuración de su empresa |

---

### USER (Usuario/Empleado)

El usuario tiene acceso limitado, dependiendo del **sector** del tenant.

#### Para sectores de SERVICIO (salud, belleza, legal, educación, servicios)

| Sección | Visible | Descripción |
|---------|---------|-------------|
| Dashboard/Resumen | ❌ | Redirigido a agenda |
| Profesionales | ✅ | Ver colegas |
| Catálogo | ✅ | Ver servicios disponibles |
| Mis Pedidos | ✅ | Sus pedidos (si aplica) |
| Mi Agenda | ✅ | Sus citas/turnos |
| Mis Reservas | ✅ | Solo restaurantes |
| Ajustes | ✅ | Su perfil |

#### Para sectores de RETAIL (restaurante, comercio, retail, belleza)

| Sección | Visible | Descripción |
|---------|---------|-------------|
| Dashboard/Resumen | ❌ | Redirigido a pedidos |
| Profesionales | ✅ | Ver colegas |
| Catálogo | ✅ | Ver productos disponibles |
| Mis Pedidos | ✅ | Sus pedidos |
| Agenda | ❌ | No aplica |
| Mis Reservas | ✅ | Solo restaurantes |
| Ajustes | ✅ | Su perfil |

---

## 🏢 VISIBILIDAD POR SECTOR (TENANT)

El sector del tenant determina qué funcionalidades aparecen.

| Sector | Pedidos | Agenda | Reservas | Catálogo |
|--------|---------|--------|----------|----------|
| **restaurante** | ✅ | ✅ | ✅ | ✅ |
| **retail** | ✅ | ❌ | ❌ | ✅ |
| **comercio** | ✅ | ❌ | ❌ | ✅ |
| **salud** | ❌ | ✅ | ❌ | ✅ (servicios) |
| **belleza** | ✅ | ✅ | ❌ | ✅ |
| **legal** | ❌ | ✅ | ❌ | ✅ (servicios) |
| **educacion** | ❌ | ✅ | ❌ | ✅ (cursos) |
| **servicios** | ✅ | ✅ | ❌ | ✅ |

---

## 🔑 LÓGICA DE REDIRECCIÓN

### Usuario con rol "user" al iniciar sesión:

```
SI sector es servicio (salud, belleza, etc.)
    → Redirigir a "agenda"
SINO SI sector es retail (restaurante, comercio, etc.)
    → Redirigir a "pedidos"
SINO
    → Redirigir a "ajustes"
```

---

## 📱 IMPLEMENTACIÓN ACTUAL

La implementación actual se encuentra en [`frontend/src/app/dashboard/page.tsx`](frontend/src/app/dashboard/page.tsx):

```typescript
// Línea 98-99: Determinación de sector
const isRetail = !tenantSector || ['retail', 'comercio', 'restaurante', 'belleza', 'otros'].includes(tenantSector);
const isService = !tenantSector || ['salud', 'belleza', 'legal', 'educacion', 'servicios', 'restaurante', 'otros'].includes(tenantSector);

// Línea 214-291: Renderizado de menú según rol
{(role === "admin" || role === "superadmin") && (
  // Mostrar opción de dashboard
)}
```

---

## ⚠️ CONSIDERACIONES

1. **client** - Actualmente no tiene acceso al dashboard, usa endpoints públicos
2. **employee/staff** - No están implementados como roles separados, usan "user"
3. **doctor** - En sectores de salud, los usuarios pueden tener rol "user" pero con acceso a agenda
4. **Las invitaciones** - Permiten crear usuarios con roles específicos

---

## 🎯 MEJORAS RECOMENDADAS

1. **Separar roles de empleado**: Implementar roles específicos como `employee`, `staff`, `doctor` con permisos granulares
2. **Permisos por sección**: En lugar de mostrar/ocultar todo, permitir acceso a específicas funcionalidades
3. **Configuración por tenant**: Permitir que cada admin configure qué ven sus usuarios
4. **Roles de cliente**: Implementar acceso de cliente al portal de pedidos/citas

---

*Documento generado el 16 de febrero de 2026*
