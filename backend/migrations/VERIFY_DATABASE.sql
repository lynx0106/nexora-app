-- =====================================================
-- VERIFICACIÓN COMPLETA DE BASE DE DATOS SUPABASE
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Fecha: 2026-02-17
-- =====================================================

-- 1. VERIFICAR TABLAS EXISTENTES
SELECT 'TABLAS EXISTENTES' as seccion;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 2. VERIFICAR COLUMNAS DE INVENTARIO EN PRODUCTS
SELECT 'COLUMNAS DE INVENTARIO' as seccion;
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('cost', 'minStock', 'stock', 'price')
ORDER BY column_name;

-- 3. VERIFICAR ÍNDICES
SELECT 'ÍNDICES' as seccion;
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename = 'products'
ORDER BY indexname;

-- 4. VERIFICAR RLS HABILITADO
SELECT 'RLS HABILITADO' as seccion;
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'tenants', 'products', 'orders', 'appointments', 'notifications', 'messages', 'invitations')
ORDER BY tablename;

-- 5. VERIFICAR POLÍTICAS RLS
SELECT 'POLÍTICAS RLS' as seccion;
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 6. VERIFICAR TABLA DE INVITACIONES
SELECT 'TABLA INVITATIONS' as seccion;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'invitations'
ORDER BY ordinal_position;

-- 7. CONTAR REGISTROS POR TABLA
SELECT 'CONTEO DE REGISTROS' as seccion;
SELECT 'users' as tabla, COUNT(*) as total FROM users
UNION ALL
SELECT 'tenants', COUNT(*) FROM tenants
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL
SELECT 'appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'invitations', COUNT(*) FROM invitations
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications;

-- 8. VERIFICAR PRODUCTOS CON STOCK BAJO
SELECT 'PRODUCTOS CON STOCK BAJO' as seccion;
SELECT id, name, stock, "minStock", 
       CASE WHEN stock <= "minStock" THEN '⚠️ BAJO' ELSE '✅ OK' END as estado
FROM products
WHERE "minStock" > 0
ORDER BY stock ASC
LIMIT 10;

-- 9. VERIFICAR USUARIOS Y ROLES
SELECT 'USUARIOS POR ROL' as seccion;
SELECT role, COUNT(*) as total
FROM users
GROUP BY role
ORDER BY role;

-- 10. VERIFICAR TENANTS ACTIVOS
SELECT 'TENANTS' as seccion;
SELECT id, name, slug, "isActive", "planType"
FROM tenants
ORDER BY "createdAt" DESC
LIMIT 5;

-- =====================================================
-- VERIFICACIÓN DE STORAGE BUCKETS
-- =====================================================
-- Nota: Los buckets de storage se verifican en:
-- Supabase Dashboard > Storage
-- Debe existir el bucket "products" para imágenes

-- =====================================================
-- VERIFICACIÓN DE FUNCIONES
-- =====================================================
SELECT 'FUNCIONES DEFINIDAS' as seccion;
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;
