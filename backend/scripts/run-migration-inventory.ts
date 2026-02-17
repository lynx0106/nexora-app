/**
 * Script para ejecutar la migración de inventario en Supabase
 * 
 * Uso: npx ts-node -r dotenv/config scripts/run-migration-inventory.ts
 * 
 * Asegúrate de tener DATABASE_URL en tu archivo .env
 */

import { DataSource } from 'typeorm';

const MIGRATION_SQL = `
-- Add cost column (decimal for precise cost tracking)
ALTER TABLE "products" 
ADD COLUMN IF NOT EXISTS "cost" DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- Add minStock column (minimum stock level for alerts)
ALTER TABLE "products" 
ADD COLUMN IF NOT EXISTS "minStock" INTEGER NOT NULL DEFAULT 0;

-- Create index for low stock queries
CREATE INDEX IF NOT EXISTS "idx_products_min_stock" ON "products" ("minStock");
CREATE INDEX IF NOT EXISTS "idx_products_stock_min_stock" ON "products" ("stock", "minStock");
`;

async function runMigration() {
  console.log('🚀 Iniciando migración de inventario...');
  
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? {
      rejectUnauthorized: false,
    } : false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conectado a la base de datos');

    // Check if columns already exist
    const existingColumns = await dataSource.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name IN ('cost', 'minStock')
    `);

    if (existingColumns.length >= 2) {
      console.log('⚠️ Las columnas cost y minStock ya existen. Saltando migración.');
      await dataSource.destroy();
      return;
    }

    // Run migration
    await dataSource.query(MIGRATION_SQL);
    console.log('✅ Migración ejecutada exitosamente');

    // Verify
    const newColumns = await dataSource.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name IN ('cost', 'minStock')
    `);
    
    console.log('📊 Columnas agregadas:', newColumns);

    await dataSource.destroy();
    console.log('🎉 Migración completada');
    
  } catch (error) {
    console.error('❌ Error en migración:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

runMigration();
