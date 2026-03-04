/**
 * Script para diagnosticar la base de datos y usuarios
 * Ejecutar: npx ts-node scripts/check-db.ts
 * 
 * Variables de entorno:
 * - DATABASE_URL: URL de la base de datos
 * - SEED_SUPERADMIN_PASSWORD: Contraseña del superadmin (default: superAdminPassword)
 */
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

// Use environment variable for default password
const DEFAULT_SUPERADMIN_PASSWORD = process.env.SEED_SUPERADMIN_PASSWORD || 'superAdminPassword';

async function checkDatabase() {
  console.log('🔍 Checking database connection...');
  console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
  
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set!');
    process.exit(1);
  }

  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connected!');

    // Check if users table exists
    const tableCheck = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    if (!tableCheck[0].exists) {
      console.log('❌ Users table does not exist!');
      await dataSource.destroy();
      process.exit(1);
    }
    console.log('✅ Users table exists');

    // List all users
    const users = await dataSource.query('SELECT id, email, role, "tenantId", "isActive" FROM users');
    console.log(`\n📋 Found ${users.length} users:`);
    users.forEach((u: any) => {
      console.log(`  - ${u.email} (${u.role}) - Tenant: ${u.tenantId} - Active: ${u.isActive}`);
    });

    // Check superadmin specifically
    const superadmin = await dataSource.query(
      "SELECT id, email, role, \"passwordHash\" FROM users WHERE email = 'superadmin@saas.com'"
    );
    
    if (superadmin.length === 0) {
      console.log('\n❌ Superadmin NOT FOUND!');
      console.log('Creating superadmin...');
      
      const passwordHash = await bcrypt.hash(DEFAULT_SUPERADMIN_PASSWORD, 10);
      await dataSource.query(`
        INSERT INTO users (id, email, "passwordHash", role, "tenantId", "firstName", "lastName", "isActive", "createdAt", "updatedAt")
        VALUES (gen_random_uuid(), 'superadmin@saas.com', $1, 'superadmin', 'system', 'Super', 'Admin', true, NOW(), NOW())
      `, [passwordHash]);
      
      console.log(`✅ Superadmin created with password: ${DEFAULT_SUPERADMIN_PASSWORD}`);
    } else {
      console.log('\n✅ Superadmin found!');
      console.log('  ID:', superadmin[0].id);
      console.log('  Role:', superadmin[0].role);
      
      // Verify password
      const testPassword = DEFAULT_SUPERADMIN_PASSWORD;
      const isMatch = await bcrypt.compare(testPassword, superadmin[0].passwordHash);
      console.log(`  Password "${DEFAULT_SUPERADMIN_PASSWORD}" matches:`, isMatch);
      
      if (!isMatch) {
        console.log('\n🔄 Resetting superadmin password...');
        const newHash = await bcrypt.hash(DEFAULT_SUPERADMIN_PASSWORD, 10);
        await dataSource.query(
          'UPDATE users SET "passwordHash" = $1 WHERE email = $2',
          [newHash, 'superadmin@saas.com']
        );
        console.log('✅ Password reset to: NexoraTemp2026!');
      }
    }

    await dataSource.destroy();
    console.log('\n✅ Check complete!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkDatabase();
