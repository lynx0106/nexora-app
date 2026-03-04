-- =====================================================
-- MIGRACIÓN: Sistema de Automatizaciones
-- Fecha: 4 de marzo de 2026
-- =====================================================

-- =====================================================
-- 1. TABLA DE AUTOMATIZACIONES
-- =====================================================

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

-- =====================================================
-- 2. TABLA DE HISTORIAL DE EJECUCIONES
-- =====================================================

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

-- =====================================================
-- 3. RLS POLICIES - AUTOMATIONS
-- =====================================================

ALTER TABLE automations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;

-- SELECT: Solo admin/owner/superadmin ven automatizaciones
-- El superadmin (tenantId='system') puede ver todas
CREATE POLICY "Admins can view automations"
ON automations FOR SELECT
USING (
    (
        "tenantId" IN (
            SELECT "tenantId" FROM users WHERE id::text = auth.uid()::text
            AND role IN ('admin', 'owner')
        )
    )
    OR
    (
        EXISTS (
            SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'superadmin'
        )
    )
);

-- INSERT: Solo admin/owner pueden crear
-- El superadmin puede crear en cualquier tenant
CREATE POLICY "Admins can create automations"
ON automations FOR INSERT
WITH CHECK (
    (
        "tenantId" IN (
            SELECT "tenantId" FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'owner')
        )
    )
    OR
    (
        EXISTS (
            SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'superadmin'
        )
    )
);

-- UPDATE: Solo admin/owner pueden actualizar
-- El superadmin puede actualizar cualquier automatización
CREATE POLICY "Admins can update automations"
ON automations FOR UPDATE
USING (
    (
        "tenantId" IN (
            SELECT "tenantId" FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'owner')
        )
    )
    OR
    (
        EXISTS (
            SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'superadmin'
        )
    )
);

-- DELETE: Solo admin/owner pueden eliminar
-- El superadmin puede eliminar cualquier automatización
CREATE POLICY "Admins can delete automations"
ON automations FOR DELETE
USING (
    (
        "tenantId" IN (
            SELECT "tenantId" FROM users 
            WHERE id::text = auth.uid()::text 
            AND role IN ('admin', 'owner')
        )
    )
    OR
    (
        EXISTS (
            SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'superadmin'
        )
    )
);

-- =====================================================
-- 4. RLS POLICIES - AUTOMATION RUNS
-- =====================================================

-- SELECT: Solo admin/owner ven historial
-- El superadmin puede ver todo el historial
CREATE POLICY "Admins can view automation runs"
ON automation_runs FOR SELECT
USING (
    (
        "automationId" IN (
            SELECT id FROM automations WHERE "tenantId" IN (
                SELECT "tenantId" FROM users WHERE id::text = auth.uid()::text
                AND role IN ('admin', 'owner')
            )
        )
    )
    OR
    (
        EXISTS (
            SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'superadmin'
        )
    )
);

-- INSERT: Solo el sistema puede crear registros
CREATE POLICY "System can insert automation runs"
ON automation_runs FOR INSERT
WITH CHECK (true);

-- UPDATE: Solo admin/owner pueden actualizar
-- El superadmin puede actualizar cualquier registro
CREATE POLICY "Admins can update automation runs"
ON automation_runs FOR UPDATE
USING (
    (
        "automationId" IN (
            SELECT id FROM automations WHERE "tenantId" IN (
                SELECT "tenantId" FROM users 
                WHERE id::text = auth.uid()::text 
                AND role IN ('admin', 'owner')
            )
        )
    )
    OR
    (
        EXISTS (
            SELECT 1 FROM users WHERE id::text = auth.uid()::text AND role = 'superadmin'
        )
    )
);

-- =====================================================
-- 5. COMENTARIOS
-- =====================================================

COMMENT ON TABLE automations IS 'Tabla de automatizaciones configurables por tenant';
COMMENT ON TABLE automation_runs IS 'Historial de ejecuciones de automatizaciones';
