/**
 * Script para migrar datos de Railway PostgreSQL a Supabase
 * 
 * Uso:
 * 1. Setear RAILWAY_DATABASE_URL (URL actual de Railway)
 * 2. Setear SUPABASE_DATABASE_URL (URL de Supabase)
 * 3. npx ts-node scripts/migrate-to-supabase.ts
 */

import { DataSource } from 'typeorm';

const TABLES_TO_MIGRATE = [
  'users',
  'tenants',
  'products',
  'orders',
  'order_items',
  'appointments',
  'notifications',
  'messages',
  'audit_logs',
  'invitations',
];

async function migrateToSupabase() {
  const railwayUrl = process.env.RAILWAY_DATABASE_URL || process.env.DATABASE_URL;
  const supabaseUrl = process.env.SUPABASE_DATABASE_URL;

  if (!railwayUrl) {
    console.error('❌ RAILWAY_DATABASE_URL or DATABASE_URL not set');
    process.exit(1);
  }

  if (!supabaseUrl) {
    console.error('❌ SUPABASE_DATABASE_URL not set');
    process.exit(1);
  }

  console.log('🚀 Starting migration from Railway to Supabase...\n');

  const railwayDB = new DataSource({
    type: 'postgres',
    url: railwayUrl,
    ssl: { rejectUnauthorized: false },
  });

  const supabaseDB = new DataSource({
    type: 'postgres',
    url: supabaseUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await railwayDB.initialize();
    await supabaseDB.initialize();

    console.log('✅ Connected to both databases\n');

    for (const table of TABLES_TO_MIGRATE) {
      try {
        console.log(`📦 Migrating table: ${table}`);
        
        // Get data from Railway
        const data = await railwayDB.query(`SELECT * FROM "${table}"`);
        console.log(`   Found ${data.length} records`);

        if (data.length === 0) {
          console.log(`   ⏭️ Skipping (empty)\n`);
          continue;
        }

        // Clear existing data in Supabase (optional - be careful!)
        await supabaseDB.query(`TRUNCATE TABLE "${table}" CASCADE`);
        console.log(`   Cleared existing data in Supabase`);

        // Insert data into Supabase
        const columns = Object.keys(data[0]);
        const columnNames = columns.map(c => `"${c}"`).join(', ');
        
        let insertedCount = 0;
        for (const row of data) {
          const values = columns.map(c => {
            const val = row[c];
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
            if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
            if (val instanceof Date) return `'${val.toISOString()}'`;
            return val;
          }).join(', ');

          try {
            await supabaseDB.query(
              `INSERT INTO "${table}" (${columnNames}) VALUES (${values})`
            );
            insertedCount++;
          } catch (e: any) {
            console.log(`   ⚠️ Failed to insert row: ${e.message}`);
          }
        }

        console.log(`   ✅ Inserted ${insertedCount} records\n`);
      } catch (e: any) {
        console.log(`   ⚠️ Error migrating ${table}: ${e.message}\n`);
      }
    }

    await railwayDB.destroy();
    await supabaseDB.destroy();

    console.log('🎉 Migration complete!');
    console.log('\n⚠️  IMPORTANT: Update Railway environment variables:');
    console.log('   DATABASE_URL = <your_supabase_url>');
    console.log('   Or keep both and set SUPABASE_DATABASE_URL for explicit use');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateToSupabase();
