/**
 * Script para verificar y aplicar migraciones pendientes en Supabase
 * 
 * Uso: npx ts-node -r dotenv/config scripts/verify-supabase-state.ts
 * 
 * Verifica:
 * 1. Columnas de inventario (cost, minStock)
 * 2. Políticas RLS
 * 3. Tabla de invitaciones
 * 4. Índices necesarios
 */

import { DataSource } from 'typeorm';

async function verifySupabaseState() {
  console.log('🔍 Verificando estado de Supabase...\n');
  
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? {
      rejectUnauthorized: false,
    } : false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conectado a Supabase\n');

    // 1. Verificar columnas de inventario
    console.log('📦 Verificando columnas de inventario...');
    const inventoryColumns = await dataSource.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name IN ('cost', 'minStock')
      ORDER BY column_name
    `);
    
    if (inventoryColumns.length >= 2) {
      console.log('   ✅ Columnas de inventario existen:', inventoryColumns.map((c: any) => c.column_name).join(', '));
    } else {
      console.log('   ⚠️ Faltan columnas de inventario. Ejecutando migración...');
      await dataSource.query(`
        ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "cost" DECIMAL(10, 2) NOT NULL DEFAULT 0;
        ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "minStock" INTEGER NOT NULL DEFAULT 0;
        CREATE INDEX IF NOT EXISTS "idx_products_min_stock" ON "products" ("minStock");
        CREATE INDEX IF NOT EXISTS "idx_products_stock_min_stock" ON "products" ("stock", "minStock");
      `);
      console.log('   ✅ Migración de inventario aplicada');
    }

    // 2. Verificar tabla de invitaciones
    console.log('\n📧 Verificando tabla de invitaciones...');
    const invitationsTable = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_name = 'invitations'
    `);
    
    if (invitationsTable.length > 0) {
      console.log('   ✅ Tabla invitations existe');
    } else {
      console.log('   ⚠️ Tabla invitations no existe. Creando...');
      await dataSource.query(`
        CREATE TABLE IF NOT EXISTS "invitations" (
          "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "email" VARCHAR(255) NOT NULL,
          "tenantId" UUID NOT NULL REFERENCES "tenants"("id") ON DELETE CASCADE,
          "role" VARCHAR(50) NOT NULL DEFAULT 'user',
          "token" VARCHAR(255) NOT NULL UNIQUE,
          "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
          "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "createdBy" UUID REFERENCES "users"("id") ON DELETE SET NULL
        );
        CREATE INDEX IF NOT EXISTS "idx_invitations_token" ON "invitations" ("token");
        CREATE INDEX IF NOT EXISTS "idx_invitations_email" ON "invitations" ("email");
        CREATE INDEX IF NOT EXISTS "idx_invitations_tenant" ON "invitations" ("tenantId");
      `);
      console.log('   ✅ Tabla invitations creada');
    }

    // 3. Verificar RLS habilitado
    console.log('\n🔒 Verificando Row Level Security...');
    const rlsTables = await dataSource.query(`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('users', 'tenants', 'products', 'orders', 'appointments', 'notifications', 'messages')
      ORDER BY tablename
    `);
    
    const rlsEnabled = rlsTables.filter((t: any) => t.rowsecurity === true);
    const rlsDisabled = rlsTables.filter((t: any) => t.rowsecurity === false);
    
    if (rlsDisabled.length > 0) {
      console.log('   ⚠️ RLS deshabilitado en:', rlsDisabled.map((t: any) => t.tablename).join(', '));
      console.log('   💡 Ejecuta la migración 20260216180000-add-rls-policies.sql manualmente');
    } else {
      console.log('   ✅ RLS habilitado en todas las tablas principales');
    }

    // 4. Verificar índices importantes
    console.log('\n📊 Verificando índices...');
    const indexes = await dataSource.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%'
      ORDER BY indexname
    `);
    console.log(`   ✅ ${indexes.length} índices encontrados`);

    // 5. Verificar storage buckets (requiere Supabase client)
    console.log('\n🪣 Verificando Storage Buckets...');
    console.log('   💡 Verifica manualmente en Supabase Dashboard que exista el bucket "products"');

    // 6. Resumen de tablas
    console.log('\n📋 Resumen de tablas:');
    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    tables.forEach((t: any) => {
      console.log(`   - ${t.table_name}`);
    });

    // 7. Contar registros por tabla
    console.log('\n📈 Conteo de registros:');
    const countQueries = [
      'SELECT COUNT(*) as count FROM users',
      'SELECT COUNT(*) as count FROM tenants',
      'SELECT COUNT(*) as count FROM products',
      'SELECT COUNT(*) as count FROM orders',
    ];
    
    for (const query of countQueries) {
      try {
        const result = await dataSource.query(query);
        const table = query.split('FROM ')[1];
        console.log(`   ${table}: ${result[0].count} registros`);
      } catch (e) {
        // Table might not exist
      }
    }

    await dataSource.destroy();
    console.log('\n🎉 Verificación completada');
    
  } catch (error) {
    console.error('❌ Error:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

verifySupabaseState();
