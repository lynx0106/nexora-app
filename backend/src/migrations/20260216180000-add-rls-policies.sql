-- =====================================================
-- Row Level Security (RLS) Policies for Nexora App
-- Migration: add_rls_policies
-- Date: 2026-02-16
-- =====================================================

-- Enable RLS on main tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- TENANTS TABLE POLICIES
-- =====================================================

-- Tenants are readable by authenticated users within the same tenant
CREATE POLICY "tenant_select_policy" ON tenants
    FOR SELECT
    TO authenticated
    USING (
        auth.jwt() ->> 'tenant_id' = id
        OR
        auth.jwt() ->> 'role' = 'superadmin'
    );

-- Only superadmins can insert/update tenants
CREATE POLICY "tenant_manage_policy" ON tenants
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'superadmin')
    WITH CHECK (auth.jwt() ->> 'role' = 'superadmin');

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Users are readable by authenticated users within the same tenant
CREATE POLICY "users_select_policy" ON users
    FOR SELECT
    TO authenticated
    USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Users can update their own profile
CREATE POLICY "users_update_own_policy" ON users
    FOR UPDATE
    TO authenticated
    USING (id = (auth.jwt() ->> 'sub')::uuid)
    WITH CHECK (
        id = (auth.jwt() ->> 'sub')::uuid
        OR
        (auth.jwt() ->> 'role' IN ('admin', 'superadmin'))
    );

-- Only admins can insert/delete users
CREATE POLICY "users_manage_policy" ON users
    FOR ALL
    TO authenticated
    USING (
        auth.jwt() ->> 'role' IN ('admin', 'superadmin')
    )
    WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'superadmin')
    );

-- =====================================================
-- PRODUCTS TABLE POLICIES
-- =====================================================

-- Products are readable by anyone (public catalog)
CREATE POLICY "products_public_read_policy" ON products
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

-- Products are manageable by tenant admins
CREATE POLICY "products_manage_policy" ON products
    FOR ALL
    TO authenticated
    USING (tenant_id = (SELECT id FROM tenants WHERE tenant_id = auth.jwt() ->> 'tenant_id'))
    WITH CHECK (tenant_id = (SELECT id FROM tenants WHERE tenant_id = auth.jwt() ->> 'tenant_id'));

-- =====================================================
-- ORDERS TABLE POLICIES
-- =====================================================

-- Orders are readable by authenticated users within the same tenant
CREATE POLICY "orders_select_policy" ON orders
    FOR SELECT
    TO authenticated
    USING (
        tenant_id IN (SELECT tenant_id FROM tenants WHERE id = (SELECT id FROM tenants WHERE tenant_id = auth.jwt() ->> 'tenant_id'))
        OR
        auth.jwt() ->> 'role' IN ('admin', 'superadmin')
    );

-- Orders can be created by authenticated users
CREATE POLICY "orders_insert_policy" ON orders
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Orders are updateable by tenant admins
CREATE POLICY "orders_update_policy" ON orders
    FOR UPDATE
    TO authenticated
    USING (
        tenant_id IN (SELECT tenant_id FROM tenants WHERE id = (SELECT id FROM tenants WHERE tenant_id = auth.jwt() ->> 'tenant_id'))
        OR
        auth.jwt() ->> 'role' IN ('admin', 'superadmin')
    );

-- =====================================================
-- APPOINTMENTS TABLE POLICIES
-- =====================================================

-- Appointments are readable by authenticated users within the same tenant
CREATE POLICY "appointments_select_policy" ON appointments
    FOR SELECT
    TO authenticated
    USING (
        tenant_id IN (SELECT tenant_id FROM tenants WHERE id = (SELECT id FROM tenants WHERE tenant_id = auth.jwt() ->> 'tenant_id'))
        OR
        auth.jwt() ->> 'role' IN ('admin', 'superadmin')
    );

-- Appointments can be created by anyone (public booking)
CREATE POLICY "appointments_insert_policy" ON appointments
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (true);

-- Appointments are updateable by tenant admins
CREATE POLICY "appointments_update_policy" ON appointments
    FOR UPDATE
    TO authenticated
    USING (
        tenant_id IN (SELECT tenant_id FROM tenants WHERE id = (SELECT id FROM tenants WHERE tenant_id = auth.jwt() ->> 'tenant_id'))
        OR
        auth.jwt() ->> 'role' IN ('admin', 'superadmin')
    );

-- =====================================================
-- ORDER ITEMS TABLE POLICIES
-- =====================================================

-- Order items readable by authenticated users within the same tenant
CREATE POLICY "order_items_select_policy" ON order_items
    FOR SELECT
    TO authenticated
    USING (
        order_id IN (
            SELECT id FROM orders 
            WHERE tenant_id IN (SELECT tenant_id FROM tenants WHERE id = (SELECT id FROM tenants WHERE tenant_id = auth.jwt() ->> 'tenant_id'))
        )
    );

-- =====================================================
-- NOTIFICATIONS TABLE POLICIES
-- =====================================================

-- Notifications readable by the owner
CREATE POLICY "notifications_select_policy" ON notifications
    FOR SELECT
    TO authenticated
    USING (user_id = (auth.jwt() ->> 'sub')::uuid);

-- =====================================================
-- MESSAGES TABLE POLICIES
-- =====================================================

-- Messages readable by participants in the conversation
CREATE POLICY "messages_select_policy" ON messages
    FOR SELECT
    TO authenticated
    USING (
        sender_id = (auth.jwt() ->> 'sub')::uuid
        OR
        receiver_id = (auth.jwt() ->> 'sub')::uuid
    );

-- Messages can be created by authenticated users
CREATE POLICY "messages_insert_policy" ON messages
    FOR INSERT
    TO authenticated
    WITH CHECK (
        sender_id = (auth.jwt() ->> 'sub')::uuid
    );

-- =====================================================
-- AI USAGE TABLE POLICIES
-- =====================================================

-- AI usage readable by tenant admins
CREATE POLICY "ai_usage_select_policy" ON ai_usage
    FOR SELECT
    TO authenticated
    USING (
        tenant_id IN (SELECT tenant_id FROM tenants WHERE id = (SELECT id FROM tenants WHERE tenant_id = auth.jwt() ->> 'tenant_id'))
        OR
        auth.jwt() ->> 'role' IN ('admin', 'superadmin')
    );

-- =====================================================
-- AUDIT LOGS TABLE POLICIES
-- =====================================================

-- Audit logs readable only by superadmins
CREATE POLICY "audit_logs_select_policy" ON audit_logs
    FOR SELECT
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'superadmin');

-- =====================================================
-- INVITATIONS TABLE POLICIES
-- =====================================================

-- Invitations readable by tenant admins
CREATE POLICY "invitations_select_policy" ON invitations
    FOR SELECT
    TO authenticated
    USING (
        tenant_id IN (SELECT tenant_id FROM tenants WHERE id = (SELECT id FROM tenants WHERE tenant_id = auth.jwt() ->> 'tenant_id'))
        OR
        auth.jwt() ->> 'role' IN ('admin', 'superadmin')
    );

-- Invitations can be created by tenant admins
CREATE POLICY "invitations_insert_policy" ON invitations
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'superadmin')
    );
