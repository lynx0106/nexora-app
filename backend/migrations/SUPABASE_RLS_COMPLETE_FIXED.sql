-- =====================================================
-- MIGRACIÓN: Fortalecer RLS Policies en Supabase
-- Fecha: 19 de febrero de 2026
-- CORREGIDO: Nombres de columnas con comillas para case-sensitive
-- =====================================================

-- =====================================================
-- IMPORTANTE: Ejecutar primero este query para ver las columnas reales
-- =====================================================
-- SELECT column_name, table_name FROM information_schema.columns 
-- WHERE table_schema = 'public' AND column_name ILIKE '%tenant%';

-- =====================================================
-- 1. NOTIFICATIONS
-- =====================================================

-- Habilitar RLS en la tabla
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: Usuarios solo ven notificaciones de su tenant
CREATE POLICY "Users can view their tenant notifications"
ON notifications FOR SELECT
USING (
  "tenantId" IN (
    SELECT "tenantId" FROM users WHERE id = auth.uid()::text
  )
);

-- Política para INSERT: Solo usuarios autenticados de su tenant
CREATE POLICY "Users can insert notifications for their tenant"
ON notifications FOR INSERT
WITH CHECK (
  "tenantId" IN (
    SELECT "tenantId" FROM users WHERE id = auth.uid()::text
  )
);

-- Política para UPDATE: Solo admin/owner pueden actualizar
CREATE POLICY "Admins can update notifications"
ON notifications FOR UPDATE
USING (
  "tenantId" IN (
    SELECT "tenantId" FROM users 
    WHERE id = auth.uid()::text 
    AND role IN ('admin', 'owner', 'superadmin')
  )
);

-- Política para DELETE: Solo admin/owner pueden eliminar
CREATE POLICY "Admins can delete notifications"
ON notifications FOR DELETE
USING (
  "tenantId" IN (
    SELECT "tenantId" FROM users 
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
  "tenantId" IN (
    SELECT "tenantId" FROM users WHERE id = auth.uid()::text
  )
);

-- Política para INSERT: Solo usuarios autenticados de su tenant
CREATE POLICY "Users can insert messages for their tenant"
ON messages FOR INSERT
WITH CHECK (
  "tenantId" IN (
    SELECT "tenantId" FROM users WHERE id = auth.uid()::text
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
  "tenantId" IN (
    SELECT "tenantId" FROM users 
    WHERE id = auth.uid()::text 
    AND role IN ('admin', 'owner', 'superadmin')
  )
  OR "tenantId" = 'system' AND (
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
  "tenantId" IN (
    SELECT "tenantId" FROM users WHERE id = auth.uid()::text
  )
  OR email = (
    SELECT email FROM users WHERE id = auth.uid()::text
  )
);

-- Política para INSERT: Solo admin/owner pueden crear invitaciones
CREATE POLICY "Admins can create invitations"
ON invitations FOR INSERT
WITH CHECK (
  "tenantId" IN (
    SELECT "tenantId" FROM users 
    WHERE id = auth.uid()::text 
    AND role IN ('admin', 'owner', 'superadmin')
  )
);

-- Política para UPDATE: Solo admin/owner pueden actualizar
CREATE POLICY "Admins can update invitations"
ON invitations FOR UPDATE
USING (
  "tenantId" IN (
    SELECT "tenantId" FROM users 
    WHERE id = auth.uid()::text 
    AND role IN ('admin', 'owner', 'superadmin')
  )
);

-- Política para DELETE: Solo admin/owner pueden eliminar
CREATE POLICY "Admins can delete invitations"
ON invitations FOR DELETE
USING (
  "tenantId" IN (
    SELECT "tenantId" FROM users 
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
  "tenantId" IN (
    SELECT "tenantId" FROM users WHERE id = auth.uid()::text
  )
);

-- Política para INSERT: Solo admin/owner/staff pueden crear movimientos
CREATE POLICY "Staff can create inventory movements"
ON inventory_movements FOR INSERT
WITH CHECK (
  "tenantId" IN (
    SELECT "tenantId" FROM users 
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
  "tenantId" IN (
    SELECT "tenantId" FROM users WHERE id = auth.uid()::text
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
  "orderId" IN (
    SELECT id FROM orders WHERE "tenantId" IN (
      SELECT "tenantId" FROM users WHERE id = auth.uid()::text
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
  cmd
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- 1. Las columnas camelCase deben ir entre comillas dobles: "tenantId"
-- 2. Si una tabla no existe, el script fallará - comentar esa sección
-- 3. Probar cada política antes de aplicar en producción
-- 4. Mantener un backup antes de ejecutar
-- 5. El rol 'superadmin' tiene acceso global
-- =====================================================
