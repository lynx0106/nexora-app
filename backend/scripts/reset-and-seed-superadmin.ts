/**
 * Script: Limpia la base de datos, ejecuta migraciones y crea superadmin.
 * Uso: npm run reset-and-seed
 *
 * Genera credenciales nuevas para superadmin.
 * Requiere: DATABASE_URL o variables de conexión en .env
 */

import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { getDatabaseConfig } from '../src/config/database.config';

const SUPERADMIN_EMAIL =
  process.env.SUPERADMIN_EMAIL || 'superadmin@nexora.app';
const SUPERADMIN_PASSWORD =
  process.env.SUPERADMIN_PASSWORD ||
  'Nx' + crypto.randomBytes(8).toString('base64url') + '!';

const config = getDatabaseConfig();

const dataSource = new DataSource({
  type: 'postgres',
  url: config.url,
  host: config.host,
  port: config.port,
  username: config.username,
  password: config.password,
  database: config.database,
  ssl: config.ssl,
  migrations: [__dirname + '/../src/migrations/*.{ts,js}'],
  synchronize: false,
});

async function runMigrations() {
  console.log('Running migrations...');
  const migrations = await dataSource.runMigrations();
  console.log(`  Executed ${migrations.length} migration(s).`);
}

async function cleanDatabase() {
  console.log('Cleaning database...');

  const tables = [
    'refresh_tokens',
    'order_items',
    'orders',
    'appointments',
    'messages',
    'notifications',
    'ai_usage',
    'audit_logs',
    'invitation_codes',
    'invitations',
    'products',
    'users',
    'tenants',
  ];

  for (const table of tables) {
    try {
      await dataSource.query(`DELETE FROM "${table}"`);
      console.log(`  Deleted from ${table}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('does not exist')) {
        console.log(`  ${table}: table not found (skipped)`);
      } else {
        console.warn(`  Warning ${table}:`, msg);
      }
    }
  }
  console.log('Database cleaned.');
}

async function createSuperadmin() {
  console.log('Creating superadmin...');

  const passwordHash = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);

  await dataSource.query(
    `INSERT INTO users (
      id, "firstName", "lastName", email, "passwordHash",
      role, "tenantId", "isActive", "onboardingCompleted", "createdAt", "updatedAt"
    ) VALUES (
      uuid_generate_v4(),
      $1, $2, $3, $4,
      'superadmin', 'system', true, true, NOW(), NOW()
    )
    ON CONFLICT (email) DO UPDATE SET
      "passwordHash" = EXCLUDED."passwordHash",
      role = 'superadmin',
      "tenantId" = 'system',
      "isActive" = true,
      "updatedAt" = NOW()`,
    ['Super', 'Admin', SUPERADMIN_EMAIL, passwordHash],
  );

  console.log('\n========================================');
  console.log('  SUPERADMIN CREADO');
  console.log('========================================');
  console.log(`  Email:    ${SUPERADMIN_EMAIL}`);
  console.log(`  Password: ${SUPERADMIN_PASSWORD}`);
  console.log('========================================\n');
}

async function main() {
  try {
    await dataSource.initialize();
  } catch (err) {
    console.error('Cannot connect to database:', err);
    process.exit(1);
  }

  try {
    await runMigrations();
    await cleanDatabase();
    await createSuperadmin();
    console.log('Done.');
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

main();
