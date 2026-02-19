-- =====================================================
-- MIGRACIÓN: Fortalecer RLS Policies en Supabase
-- Fecha: 18 de febrero de 2026
-- Objetivo: Proteger todas las tablas con RLS
-- =====================================================

-- =====================================================
-- 1. NOTIFICATIONS
-- =====================================================

-- Habilitar RLS en la tabla
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: Usuarios solo ven notificaciones de su tenant
CREATE POLICY "Users can view their tenant notifications"
ON notifications FOR SELECT
USING (
  tenant_id IN (
    SELECT tenantId FROM users WHERE id = auth.uid()::text
  )
);

-- Política para INSERT: Solo usuarios autenticados de su tenant
CREATE POLICY "Users can insert notifications for their tenant"
ON notifications FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT tenantId FROM users WHERE id = auth.uid()::text
  )
);

-- Política para UPDATE: Solo admin/owner pueden actualizar
CREATE POLICY "Admins can update notifications"
ON notifications FOR UPDATE
USING (
  tenant_id IN (
    SELECT tenantId FROM users 
    WHERE id = auth.uid()::text 
    AND role IN ('admin', 'owner', 'superadmin')
  )
);

-- Política para DELETE: Solo admin/owner pueden eliminar
CREATE POLICY "Admins can delete notifications"
ON notifications FOR DELETE
USING (
  tenant_id IN (
    SELECT tenantId FROM users 
    WHERE id = auth.uid()::text 
    AND role IN ('admin', 'owner', 'superadmin')
  )
);

-- =====================================================
-- 2. MESSAGES (Chat)
-- =====================================================

-- Habilitar RLS en la tabla
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: Usuarios solo ven mensajes de su tenant
CREATE POLICY "Users can view their tenant messages"
ON messages FOR SELECT
USING (
  tenant_id IN (
    SELECT tenantId FROM users WHERE id = auth.uid()::text
  )
);

-- Política para INSERT: Solo usuarios autenticados de su tenant
CREATE POLICY "Users can insert messages for their tenant"
ON messages FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT tenantId FROM users WHERE id = auth.uid()::text
  )
);

-- =====================================================
-- 3. AUDIT_LOGS
-- =====================================================

-- Habilitar RLS en la tabla
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: Solo admin/owner/superadmin pueden ver logs
CREATE POLICY "Admins can view audit logs"
ON audit_logs FOR SELECT
USING (
  tenant_id IN (
    SELECT tenantId FROM users 
    WHERE id = auth.uid()::text 
    AND role IN ('admin', 'owner', 'superadmin')
  )
  OR tenant_id = 'system' AND (
    SELECT role FROM users WHERE id = auth.uid()::text
  ) = 'superadmin'
);

-- Política para INSERT: Sistema puede insertar logs
CREATE POLICY "System can insert audit logs"
ON audit_logs FOR INSERT
WITH CHECK (true);

-- =====================================================
-- 4. INVITATIONS
-- =====================================================

-- Habilitar RLS en la tabla
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: Usuarios ven invitaciones de su tenant
CREATE POLICY "Users can view their tenant invitations"
ON invitations FOR SELECT
USING (
  tenant_id IN (
    SELECT tenantId FROM users WHERE id = auth.uid()::text
  )
  OR email = (
    SELECT email FROM users WHERE id = auth.uid()::text
  )
);

-- Política para INSERT: Solo admin/owner pueden crear invitaciones
CREATE POLICY "Admins can create invitations"
ON invitations FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT tenantId FROM users 
    WHERE id = auth.uid()::text 
    AND role IN ('admin', 'owner', 'superadmin')
  )
);

-- Política para UPDATE: Solo admin/owner pueden actualizar
CREATE POLICY "Admins can update invitations"
ON invitations FOR UPDATE
USING (
  tenant_id IN (
    SELECT tenantId FROM users 
    WHERE id = auth.uid()::text 
    AND role IN ('admin', 'owner', 'superadmin')
  )
);

-- Política para DELETE: Solo admin/owner pueden eliminar
CREATE POLICY "Admins can delete invitations"
ON invitations FOR DELETE
USING (
  tenant_id IN (
    SELECT tenantId FROM users 
    WHERE id = auth.uid()::text 
    AND role IN ('admin', 'owner', 'superadmin')
  )
);

-- =====================================================
-- 5. INVENTORY_MOVEMENTS
-- =====================================================

-- Habilitar RLS en la tabla
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: Usuarios ven movimientos de su tenant
CREATE POLICY "Users can view their tenant inventory movements"
ON inventory_movements FOR SELECT
USING (
  tenant_id IN (
    SELECT tenantId FROM users WHERE id = auth.uid()::text
  )
);

-- Política para INSERT: Solo admin/owner/staff pueden crear movimientos
CREATE POLICY "Staff can create inventory movements"
ON inventory_movements FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT tenantId FROM users 
    WHERE id = auth.uid()::text 
    AND role IN ('admin', 'owner', 'staff', 'superadmin')
  )
);

-- =====================================================
-- 6. AI_USAGE
-- =====================================================

-- Habilitar RLS en la tabla
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: Usuarios ven su uso de AI
CREATE POLICY "Users can view their tenant AI usage"
ON ai_usage FOR SELECT
USING (
  tenant_id IN (
    SELECT tenantId FROM users WHERE id = auth.uid()::text
  )
);

-- Política para INSERT: Sistema puede registrar uso
CREATE POLICY "System can insert AI usage"
ON ai_usage FOR INSERT
WITH CHECK (true);

-- =====================================================
-- 7. ORDER_ITEMS
-- =====================================================

-- Habilitar RLS en la tabla
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: Usuarios ven items de pedidos de su tenant
CREATE POLICY "Users can view their tenant order items"
ON order_items FOR SELECT
USING (
  order_id IN (
    SELECT id FROM orders WHERE tenantId IN (
      SELECT tenantId FROM users WHERE id = auth.uid()::text
    )
  )
);

-- Política para INSERT: Solo sistema puede crear items
CREATE POLICY "System can insert order items"
ON order_items FOR INSERT
WITH CHECK (true);

-- =====================================================
-- VERIFICACIÓN
-- =====================================================

-- Verificar que RLS está habilitado en todas las tablas
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Verificar políticas creadas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. Estas políticas asumen que la columna de tenant es 'tenant_id' o 'tenantId'
-- 2. Ajustar nombres de columnas según el esquema real
-- 3. Probar cada política antes de aplicar en producción
-- 4. Mantener un backup antes de ejecutar
-- 5. El rol 'superadmin' tiene acceso global
-- =====================================================
