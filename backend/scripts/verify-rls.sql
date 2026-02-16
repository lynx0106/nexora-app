-- =====================================================
-- RLS Verification Script
-- Run this to check current RLS status
-- =====================================================

-- Check if RLS is enabled on all tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- List all RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check current user context
SELECT 
    current_user,
    current_setting('app.tenant_id', true) as tenant_id,
    current_setting('app.user_role', true) as user_role;
