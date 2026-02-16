# 🔒 Row Level Security (RLS) - Documentación

**Fecha:** 16 de febrero de 2026  
**Versión:** 1.0  
**Base de Datos:** PostgreSQL (Supabase)

---

## 📋 Resumen

Row Level Security (RLS) es una característica de PostgreSQL que permite controlar el acceso a las filas de una tabla basándose en el usuario que ejecuta la consulta. En Nexora App, RLS garantiza el aislamiento de datos entre tenants.

### Estado: ✅ IMPLEMENTADO

| Tabla | RLS Habilitado | Políticas | Estado |
|-------|----------------|-----------|--------|
| users | ✅ | 3 políticas | ✅ Activo |
| tenants | ✅ | 2 políticas | ✅ Activo |
| products | ✅ | 2 políticas | ✅ Activo |
| orders | ✅ | 4 políticas | ✅ Activo |
| appointments | ✅ | 3 políticas | ✅ Activo |
| order_items | ✅ | 1 política | ✅ Activo |
| notifications | ✅ | 1 política | ✅ Activo |
| messages | ✅ | 2 políticas | ✅ Activo |
| ai_usage | ✅ | 1 política | ✅ Activo |
| audit_logs | ✅ | 1 política | ✅ Activo |
| invitations | ✅ | 2 políticas | ✅ Activo |

---

## 🏗️ Arquitectura de Seguridad

```
┌─────────────────────────────────────────────────────────────┐
│                    REQUEST ENTRANTE                         │
│         (Con JWT Token en Header)                           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              SUPABASE AUTH / JWT VERIFY                     │
│  - Extrae user_id, tenant_id, role del JWT                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              ROW LEVEL SECURITY (RLS)                       │
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │  Política   │    │  Política   │    │  Política   │     │
│  │   SELECT    │    │   INSERT    │    │   UPDATE    │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
│  Verificación: ¿El usuario tiene permiso para esta fila?   │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              ACCESO PERMITIDO / DENEGADO                    │
│                                                             │
│  ✅ Permitido: Usuario ve/modifica solo sus datos          │
│  ❌ Denegado: Usuario no puede acceder a datos ajenos       │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Políticas por Tabla

### 1. 👥 USERS

#### Política: `users_select_policy`
**Acción:** SELECT  
**Aplicable a:** authenticated  
**Condición:**
```sql
tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
```
**Descripción:** Los usuarios solo pueden ver usuarios de su mismo tenant.

---

#### Política: `users_update_own_policy`
**Acción:** UPDATE  
**Aplicable a:** authenticated  
**Condición:**
```sql
id = (auth.jwt() ->> 'sub')::uuid
OR
(auth.jwt() ->> 'role' IN ('admin', 'superadmin'))
```
**Descripción:** Los usuarios pueden editar su propio perfil. Admins pueden editar cualquier usuario de su tenant.

---

#### Política: `users_manage_policy`
**Acción:** ALL (INSERT, UPDATE, DELETE)  
**Aplicable a:** authenticated  
**Condición:**
```sql
auth.jwt() ->> 'role' IN ('admin', 'superadmin')
```
**Descripción:** Solo admins y superadmins pueden crear/eliminar usuarios.

---

### 2. 🏢 TENANTS

#### Política: `tenant_select_policy`
**Acción:** SELECT  
**Condición:**
```sql
auth.jwt() ->> 'tenant_id' = id
OR
auth.jwt() ->> 'role' = 'superadmin'
```
**Descripción:** Los usuarios solo ven su propio tenant. Superadmins ven todos.

---

#### Política: `tenant_manage_policy`
**Acción:** ALL  
**Condición:**
```sql
auth.jwt() ->> 'role' = 'superadmin'
```
**Descripción:** Solo superadmins pueden crear/modificar/eliminar tenants.

---

### 3. 📦 PRODUCTS

#### Política: `products_public_read_policy`
**Acción:** SELECT  
**Aplicable a:** anon, authenticated  
**Condición:**
```sql
is_active = true
```
**Descripción:** Los productos activos son públicos (catálogo visible sin auth).

---

#### Política: `products_manage_policy`
**Acción:** ALL  
**Condición:**
```sql
tenant_id = (SELECT id FROM tenants WHERE tenant_id = auth.jwt() ->> 'tenant_id')
```
**Descripción:** Solo admins del tenant pueden gestionar productos.

---

### 4. 🛒 ORDERS

#### Política: `orders_select_policy`
**Acción:** SELECT  
**Condición:**
```sql
tenant_id IN (SELECT tenant_id FROM tenants WHERE id = (SELECT id FROM tenants WHERE tenant_id = auth.jwt() ->> 'tenant_id'))
OR
auth.jwt() ->> 'role' IN ('admin', 'superadmin')
```

---

#### Política: `orders_insert_policy`
**Acción:** INSERT  
**Condición:** `true` (cualquiera puede crear pedidos)

---

#### Política: `orders_update_policy`
**Acción:** UPDATE  
**Condición:** Solo admins del tenant o superadmins.

---

### 5. 📅 APPOINTMENTS

#### Política: `appointments_select_policy`
**Acción:** SELECT  
**Condición:** Solo usuarios del mismo tenant o admins.

---

#### Política: `appointments_insert_policy`
**Acción:** INSERT  
**Aplicable a:** anon, authenticated  
**Condición:** `true` (reservas públicas)

---

#### Política: `appointments_update_policy`
**Acción:** UPDATE  
**Condición:** Solo admins del tenant.

---

### 6. 💬 MESSAGES

#### Política: `messages_select_policy`
**Acción:** SELECT  
**Condición:**
```sql
sender_id = (auth.jwt() ->> 'sub')::uuid
OR
receiver_id = (auth.jwt() ->> 'sub')::uuid
```
**Descripción:** Los usuarios solo ven mensajes donde son remitente o destinatario.

---

#### Política: `messages_insert_policy`
**Acción:** INSERT  
**Condición:**
```sql
sender_id = (auth.jwt() ->> 'sub')::uuid
```
**Descripción:** Los usuarios solo pueden enviar mensajes como ellos mismos.

---

### 7. 🔔 NOTIFICATIONS

#### Política: `notifications_select_policy`
**Acción:** SELECT  
**Condición:**
```sql
user_id = (auth.jwt() ->> 'sub')::uuid
```
**Descripción:** Los usuarios solo ven sus propias notificaciones.

---

### 8. 📋 AUDIT LOGS

#### Política: `audit_logs_select_policy`
**Acción:** SELECT  
**Condición:**
```sql
auth.jwt() ->> 'role' = 'superadmin'
```
**Descripción:** Solo superadmins pueden ver logs de auditoría.

---

## 🔧 Comandos de Administración

### Verificar estado de RLS

```sql
-- Listar tablas con RLS habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE rowsecurity = true;

-- Listar políticas por tabla
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Deshabilitar RLS (emergencia)

```sql
-- ⚠️ Solo en caso de emergencia
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE tenants DISABLE ROW LEVEL SECURITY;
-- ... etc
```

### Forzar RLS para usuarios con privilegios

```sql
-- Asegurar que incluso el postgres user respete RLS
ALTER TABLE users FORCE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
-- ... etc
```

---

## 🧪 Tests de Verificación

### Test 1: Aislamiento de Tenants

```sql
-- Simular request como usuario de tenant A
SET LOCAL ROLE authenticated;
SET request.jwt.claims TO '{"sub": "user-a", "tenant_id": "tenant-a", "role": "user"}';

-- Intentar ver usuarios de tenant B (debe fallar)
SELECT * FROM users WHERE tenant_id = 'tenant-b'; -- → 0 resultados
```

### Test 2: Acceso Admin

```sql
-- Simular request como admin
SET request.jwt.claims TO '{"sub": "admin-a", "tenant_id": "tenant-a", "role": "admin"}';

-- Ver usuarios de su tenant (debe funcionar)
SELECT * FROM users WHERE tenant_id = 'tenant-a'; -- → Resultados
```

### Test 3: Acceso Superadmin

```sql
-- Simular request como superadmin
SET request.jwt.claims TO '{"sub": "superadmin", "role": "superadmin"}';

-- Ver todos los tenants (debe funcionar)
SELECT * FROM tenants; -- → Todos los tenants
```

---

## ⚠️ Troubleshooting

### Problema: "No se ven los datos"
**Causa probable:** El JWT no tiene el claim `tenant_id`  
**Solución:** Verificar que el JWT incluya el tenant_id del usuario.

### Problema: "RLS bloquea todo"
**Causa probable:** Falta la política para el rol `anon` o `authenticated`  
**Solución:** Verificar que las políticas incluyan el rol correcto.

### Problema: "Los admins no pueden ver todo"
**Causa probable:** La política no incluye la condición de superadmin  
**Solución:** Agregar `OR auth.jwt() ->> 'role' = 'superadmin'`.

---

## 📈 Monitoreo

### Consultas para monitoreo

```sql
-- Contar rechazos de RLS (si está habilitado el logging)
SELECT 
    tablename,
    COUNT(*) as denied_count
FROM pg_stat_statements 
WHERE query LIKE '%ROW SECURITY%'
GROUP BY tablename;

-- Verificar distribución de datos por tenant
SELECT 
    tenant_id,
    COUNT(*) as user_count
FROM users
GROUP BY tenant_id;
```

---

## 🔐 Mejores Prácticas

1. **SIEMPRE** habilitar RLS en tablas con datos sensibles
2. **NUNCA** confiar solo en la aplicación para seguridad
3. **VERIFICAR** periódicamente las políticas con tests automatizados
4. **AUDITAR** cambios en políticas RLS
5. **DOCUMENTAR** cada política con comentarios claros

---

## 📚 Referencias

- [PostgreSQL RLS Documentation](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Nexora App - DIAGNOSTICO_CTO](./DIAGNOSTICO_CTO_NEXORA_APP.md)

---

**Última actualización:** 16 de febrero de 2026  
**Responsable:** Equipo de Seguridad Nexora
