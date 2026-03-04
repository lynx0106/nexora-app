/**
 * Script para ejecutar la migración de Automatizaciones en Supabase
 * 
 * Uso: cd backend && npx ts-node scripts/migrate-automations.ts
 * 
 * Requiere variable de entorno: DATABASE_URL (URL de Supabase/PostgreSQL)
 * 
 * Este script:
 * 1. Crea las tablas automations y automation_runs si no existen
 * 2. Crea los índices correspondientes
 * 3. Habilita RLS y crea las políticas de seguridad
 * 4. Todo con IF NOT EXISTS para ser idempotente
 */

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno desde .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const migrationSQL = `
-- =====================================================
-- MIGRACIÓN: Sistema de Automatizaciones
-- Fecha: 4 de marzo de 2026
-- =====================================================

-- 1. TABLA DE AUTOMATIZACIONES
CREATE TABLE IF NOT EXISTS automations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "tenantId" TEXT REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('reminder', 'bulk_message', 'individual_message', 'cleanup')),
    description TEXT,
    enabled BOOLEAN DEFAULT true,
    schedule VARCHAR(100),
    config JSONB DEFAULT '{}'::jsonb,
    "lastRunAt" TIMESTAMP WITH TIME ZONE,
    "nextRunAt" TIMESTAMP WITH TIME ZONE,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_automations_tenant ON automations("tenantId");
CREATE INDEX IF NOT EXISTS idx_automations_enabled ON automations(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_automations_next_run ON automations("nextRunAt") WHERE "nextRunAt" IS NOT NULL;

-- 2. TABLA DE HISTORIAL DE EJECUCIONES
CREATE TABLE IF NOT EXISTS automation_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "automationId" UUID REFERENCES automations(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    result JSONB DEFAULT '{}'::jsonb,
    "errorMessage" TEXT,
    "startedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "completedAt" TIMESTAMP WITH TIME ZONE,
    "executedBy" TEXT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_automation_runs_automation ON automation_runs("automationId");
CREATE INDEX IF NOT EXISTS idx_automation_runs_status ON automation_runs(status);
CREATE INDEX IF NOT EXISTS idx_automation_runs_started ON automation_runs("startedAt");

-- 3. RLS POLICIES - AUTOMATIONS
ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si hay
DROP POLICY IF EXISTS "Admins can view automations" ON automations;
DROP POLICY IF EXISTS "Admins can create automations" ON automations;
DROP POLICY IF EXISTS "Admins can update automations" ON automations;
DROP POLICY IF EXISTS "Admins can delete automations" ON automations;

-- SELECT: Admin/owner/superadmin
CREATE POLICY "Admins can view automations"
ON automations FOR SELECT
USING (
    ("tenantId" IN (SELECT "tenantId" FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'owner')))
    OR (EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'superadmin'))
);

-- INSERT
CREATE POLICY "Admins can create automations"
ON automations FOR INSERT
WITH CHECK (
    ("tenantId" IN (SELECT "tenantId" FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'owner')))
    OR (EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'superadmin'))
);

-- UPDATE
CREATE POLICY "Admins can update automations"
ON automations FOR UPDATE
USING (
    ("tenantId" IN (SELECT "tenantId" FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'owner')))
    OR (EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'superadmin'))
);

-- DELETE
CREATE POLICY "Admins can delete automations"
ON automations FOR DELETE
USING (
    ("tenantId" IN (SELECT "tenantId" FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'owner')))
    OR (EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'superadmin'))
);

-- 4. RLS POLICIES - AUTOMATION RUNS
DROP POLICY IF EXISTS "Admins can view automation runs" ON automation_runs;
DROP POLICY IF EXISTS "System can insert automation runs" ON automation_runs;
DROP POLICY IF EXISTS "Admins can update automation runs" ON automation_runs;

-- SELECT
CREATE POLICY "Admins can view automation runs"
ON automation_runs FOR SELECT
USING (
    ("automationId" IN (SELECT id FROM automations WHERE "tenantId" IN (SELECT "tenantId" FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'owner'))))
    OR (EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'superadmin'))
);

-- INSERT (sistema)
CREATE POLICY "System can insert automation runs"
ON automation_runs FOR INSERT
WITH CHECK (true);

-- UPDATE
CREATE POLICY "Admins can update automation runs"
ON automation_runs FOR UPDATE
USING (
    ("automationId" IN (SELECT id FROM automations WHERE "tenantId" IN (SELECT "tenantId" FROM users WHERE id::text = auth.uid()::text AND role IN ('admin', 'owner'))))
    OR (EXISTS (SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'superadmin'))
);

-- Comentarios
COMMENT ON TABLE automations IS 'Tabla de automatizaciones configurables por tenant';
COMMENT ON TABLE automation_runs IS 'Historial de ejecuciones de automatizaciones';
`;

async function runMigration() {
  console.log('🔄 Iniciando migración de Automatizaciones...\n');
  
  // Usar SUPABASE_DATABASE_URL si DATABASE_URL no está definido
  const databaseUrl = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ Error: Se requiere la variable de entorno DATABASE_URL o SUPABASE_DATABASE_URL');
    console.log('\nEl script intentará leer desde .env automáticamente');
    process.exit(1);
  }

  const dataSource = new DataSource({
    type: 'postgres',
    url: databaseUrl,
    ssl: databaseUrl.includes('supabase') ? { rejectUnauthorized: false } : false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conexión a la base de datos establecida\n');

    // Ejecutar migración
    console.log('📝 Ejecutando SQL de migración...\n');
    await dataSource.query(migrationSQL);

    console.log('\n✅ Migración completada exitosamente!');
    console.log('\n📋 Resumen:');
    console.log('   - Tabla "automations" creada/configurada');
    console.log('   - Tabla "automation_runs" creada/configurada');
    console.log('   - Índices creados');
    console.log('   - RLS habilitado con políticas para admin/owner/superadmin');

  } catch (error: any) {
    console.error('\n❌ Error durante la migración:', error.message);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

runMigration();
