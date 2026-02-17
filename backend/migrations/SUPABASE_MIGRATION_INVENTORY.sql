-- =====================================================
-- MIGRACIÓN DE INVENTARIO PARA SUPABASE
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Fecha: 2026-02-17
-- =====================================================

-- 1. Agregar columnas de inventario a la tabla products
ALTER TABLE "products" 
ADD COLUMN IF NOT EXISTS "cost" DECIMAL(10, 2) NOT NULL DEFAULT 0;

ALTER TABLE "products" 
ADD COLUMN IF NOT EXISTS "minStock" INTEGER NOT NULL DEFAULT 0;

-- 2. Crear índices para consultas de stock bajo
CREATE INDEX IF NOT EXISTS "idx_products_min_stock" ON "products" ("minStock");
CREATE INDEX IF NOT EXISTS "idx_products_stock_min_stock" ON "products" ("stock", "minStock");

-- 3. Agregar comentarios a las columnas
COMMENT ON COLUMN "products"."cost" IS 'Cost price of the product for margin calculations';
COMMENT ON COLUMN "products"."minStock" IS 'Minimum stock level for low stock alerts';

-- 4. Verificar que las columnas fueron agregadas
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
AND column_name IN ('cost', 'minStock');

-- =====================================================
-- VERIFICAR QUE FUNCIONA
-- =====================================================
-- Ejecutar esta consulta para verificar:
-- SELECT "id", "name", "stock", "cost", "minStock" FROM "products" LIMIT 5;
