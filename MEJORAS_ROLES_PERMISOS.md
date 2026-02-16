# 🚀 PROPUESTA DE MEJORAS - ROLES Y PERMISOS

## 1. ESTRUCTURA DE ROLES MEJORADA

### Roles Actuales vs Propuestos

| Actual | Propuesto | Descripción |
|--------|-----------|-------------|
| `superadmin` | `superadmin` | Sin cambios (administrador de plataforma) |
| `admin` | `admin` | Administrador de tenant |
| `user` | `employee` | Empleado genérico |
| - | `staff` | Personal de atención al cliente |
| - | `doctor` | Profesional de salud |
| - | `support` | Soporte técnico |
| `client` | `client` | Cliente externo |

---

## 2. SISTEMA DE PERMISOS GRANULARES

### Permisos por Módulo

```typescript
enum Permission {
  // Usuarios
  USERS_VIEW = 'users:view',
  USERS_CREATE = 'users:create',
  USERS_EDIT = 'users:edit',
  USERS_DELETE = 'users:delete',

  // Productos
  PRODUCTS_VIEW = 'products:view',
  PRODUCTS_MANAGE = 'products:manage',

  // Pedidos
  ORDERS_VIEW = 'orders:view',
  ORDERS_MANAGE = 'orders:manage',
  ORDERS_CREATE = 'orders:create',

  // Citas
  APPOINTMENTS_VIEW = 'appointments:view',
  APPOINTMENTS_MANAGE = 'appointments:manage',
  APPOINTMENTS_CREATE = 'appointments:create',

  // Pagos
  PAYMENTS_VIEW = 'payments:view',
  PAYMENTS_MANAGE = 'payments:manage',

  // Configuración
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_EDIT = 'settings:edit',

  // Reportes
  REPORTS_VIEW = 'reports:view',
  REPORTS_EXPORT = 'reports:export',
}
```

### Matriz de Permisos por Rol

| Permiso | Superadmin | Admin | Employee | Staff | Doctor | Client |
|---------|------------|-------|----------|-------|--------|--------|
| users:view | ✅ | ✅ su tenant | ✅ | ✅ | ❌ | ❌ |
| users:create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| users:delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| products:view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| products:manage | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| orders:view | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| orders:manage | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| orders:create | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| appointments:view | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| appointments:manage | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| appointments:create | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| settings:view | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| settings:edit | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 3. IMPLEMENTACIÓN PROPUESTA

### Backend - Entidad de Rol

```typescript
// roles.entity.ts
@Entity()
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // 'admin', 'employee', 'doctor', etc.

  @Column('simple-array')
  permissions: string[]; // Array de permisos

  @Column({ nullable: true })
  tenantId: string; // null para superadmin

  @Column({ default: true })
  isActive: boolean;
}
```

### Frontend - Hook de Permisos

```typescript
// usePermissions.ts
const rolePermissions = {
  admin: ['users:view', 'users:create', 'products:manage', ...],
  employee: ['products:view', 'orders:create', 'appointments:view', ...],
  // ...
};

export function usePermissions() {
  const { role } = getUserFromToken();
  const permissions = rolePermissions[role] || [];

  return {
    hasPermission: (permission: string) => permissions.includes(permission),
    canView: (module: string) => permissions.includes(`${module}:view`),
    canEdit: (module: string) => permissions.includes(`${module}:edit`),
  };
}
```

### Frontend - Componente de Protección

```tsx
<RequirePermission permission="users:create">
  <Button>Crear Usuario</Button>
</RequirePermission>
```

---

## 4. CONFIGURACIÓN POR TENANT

Permitir que cada admin configure qué ven sus empleados:

```typescript
// Configuración en tenant
{
  id: "restaurante-demo",
  roleConfig: {
    employee: {
      canViewOrders: true,
      canEditOrders: false,
      canViewProducts: true,
      canEditProducts: false,
    }
  }
}
```

---

## 5. BENEFICIOS DE ESTA MEJORA

1. **Mayor seguridad** - Control granular por功能
2. **Flexibilidad** - Cada tenant puede adaptar permisos
3. **Escalabilidad** - Fácil agregar nuevos roles
4. **UX mejorada** - Usuarios ven solo lo que necesitan
5. **Auditoría** - Rastreo de quién hace qué

---

## 6. PRIORIDADES DE IMPLEMENTACIÓN

### Fase 1 (Crítico)
- [ ] Agregar nuevos campos de rol en BD
- [ ] Actualizar JWT para incluir permisos
- [ ] Crear middleware de verificación

### Fase 2 (Importante)
- [ ] Crear hook `usePermissions`
- [ ] Actualizar dashboard con nuevos roles
- [ ] Agregar componente `<RequirePermission>`

### Fase 3 (Nice to have)
- [ ] Configuración por tenant
- [ ] Panel de gestión de roles para superadmin

---

*Propuesta generada el 16 de febrero de 2026*
