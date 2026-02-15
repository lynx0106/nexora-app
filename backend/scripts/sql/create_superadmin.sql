-- Crea/actualiza el tenant "system" y el usuario superadmin.
-- Ejecutar en Supabase SQL Editor.
-- Este script es tolerante: si no existe una tabla, lo informa sin romper todo.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'tenants'
  ) THEN
    INSERT INTO public.tenants (
      id,
      name,
      sector,
      country,
      currency,
      "openingTime",
      "closingTime",
      "appointmentDuration",
      "aiModel"
    )
    VALUES (
      'system',
      'System',
      'otros',
      'Colombia',
      'USD',
      '09:00',
      '18:00',
      60,
      'gpt-3.5-turbo'
    )
    ON CONFLICT (id) DO UPDATE
    SET
      name = EXCLUDED.name,
      sector = EXCLUDED.sector,
      country = EXCLUDED.country,
      currency = EXCLUDED.currency;
  ELSE
    RAISE NOTICE 'Tabla public.tenants no existe en este proyecto.';
  END IF;
END
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    INSERT INTO public.users (
      id,
      "firstName",
      "lastName",
      email,
      "passwordHash",
      role,
      "tenantId",
      "isActive",
      "isAiChatActive"
    )
    VALUES (
      gen_random_uuid(),
      'Super',
      'Admin',
      'superadmin@saas.com',
      crypt('Super123!', gen_salt('bf', 10)),
      'superadmin',
      'system',
      true,
      true
    )
    ON CONFLICT (email) DO UPDATE
    SET
      "firstName" = EXCLUDED."firstName",
      "lastName" = EXCLUDED."lastName",
      "passwordHash" = EXCLUDED."passwordHash",
      role = 'superadmin',
      "tenantId" = 'system',
      "isActive" = true,
      "isAiChatActive" = true;
  ELSE
    RAISE NOTICE 'Tabla public.users no existe en este proyecto.';
  END IF;
END
$$;

-- Diagnóstico: qué tablas parecidas existen realmente.
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
  AND (table_name ILIKE '%tenant%' OR table_name ILIKE '%user%')
ORDER BY table_schema, table_name;

SELECT
  email,
  role,
  "tenantId",
  "isActive"
FROM public.users
WHERE email = 'superadmin@saas.com';
