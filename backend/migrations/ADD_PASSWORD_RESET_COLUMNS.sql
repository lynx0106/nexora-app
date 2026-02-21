-- =====================================================
-- MIGRACIÓN: Agregar columnas para reset de password
-- Fecha: 2026-02-19
-- =====================================================

-- Agregar columnas faltantes a la tabla users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS "passwordResetTokenHash" TEXT,
ADD COLUMN IF NOT EXISTS "passwordResetTokenExpiresAt" TIMESTAMPTZ;

-- Crear índice para búsqueda rápida por token
CREATE INDEX IF NOT EXISTS idx_users_password_reset_token 
ON users("passwordResetTokenHash") 
WHERE "passwordResetTokenHash" IS NOT NULL;

-- Verificar que las columnas se agregaron correctamente
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('passwordResetTokenHash', 'passwordResetTokenExpiresAt')
ORDER BY column_name;
