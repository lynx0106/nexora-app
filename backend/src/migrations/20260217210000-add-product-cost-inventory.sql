-- Migration: Add cost and minStock fields to products table
-- Date: 2026-02-17
-- Description: Adds inventory management fields for cost tracking and low stock alerts

-- Add cost column (decimal for precise cost tracking)
ALTER TABLE "products" 
ADD COLUMN IF NOT EXISTS "cost" DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- Add minStock column (minimum stock level for alerts)
ALTER TABLE "products" 
ADD COLUMN IF NOT EXISTS "minStock" INTEGER NOT NULL DEFAULT 0;

-- Create index for low stock queries
CREATE INDEX IF NOT EXISTS "idx_products_min_stock" ON "products" ("minStock");
CREATE INDEX IF NOT EXISTS "idx_products_stock_min_stock" ON "products" ("stock", "minStock");

-- Add comment to columns
COMMENT ON COLUMN "products"."cost" IS 'Cost price of the product for margin calculations';
COMMENT ON COLUMN "products"."minStock" IS 'Minimum stock level for low stock alerts';

-- Update existing products to have default values (if any exist without these columns)
UPDATE "products" 
SET "cost" = 0, "minStock" = 0 
WHERE "cost" IS NULL OR "minStock" IS NULL;
