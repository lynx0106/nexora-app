/**
 * Script para verificar y crear usuarios de prueba
 * Uso: npx ts-node scripts/verify-and-create-users.ts
 * 
 * Variables de entorno requeridas:
 * - POSTGRES_HOST: Host de PostgreSQL
 * - POSTGRES_PORT: Puerto de PostgreSQL
 * - POSTGRES_USER: Usuario de la base de datos
 * - POSTGRES_PASSWORD: Contraseña de la base de datos
 * - POSTGRES_DB: Nombre de la base de datos
 */

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

// Validar que todas las variables de entorno requeridas estén presentes
const requiredEnvVars = [
  'POSTGRES_HOST',
  'POSTGRES_PORT',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'POSTGRES_DB',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Falta la variable de entorno: ${envVar}`);
  }
}

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT!, 10),
  username: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
});

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string | null;
}

interface Tenant {
  id: string;
  name: string;
  sector: string;
}

// Usuarios que el usuario quiere verificar/crear
const DESIRED_USERS = [
  { email: 'admin@restaurant.com', password: 'Admin123!', tenantSlug: 'restaurant', tenantName: 'Restaurante Demo', sector: 'restaurant' },
  { email: 'admin@dental.com', password: 'Admin123!', tenantSlug: 'dental', tenantName: 'Clínica Dental Demo', sector: 'salud' },
  { email: 'admin@barbershop.com', password: 'Admin123!', tenantSlug: 'barbershop', tenantName: 'Barbería Demo', sector: 'belleza' },
];

async function main() {
  console.log('===========================================');
  console.log('🔍 VERIFICACIÓN DE USUARIOS DE PRUEBA');
  console.log('===========================================\n');

  try {
    await dataSource.initialize();
    console.log('✅ Conectado a PostgreSQL\n');

    // 1. Verificar tenants existentes
    console.log('📋 VERIFICANDO TENANTS:');
    console.log('-------------------------');
    
    const tenants = await dataSource.query('SELECT id, name, sector FROM tenants');
    console.log(`Tenants encontrados: ${tenants.length}`);
    tenants.forEach((t: Tenant) => {
      console.log(`  - ${t.id}: ${t.name} (${t.sector})`);
    });
    console.log('');

    // 2. Verificar usuarios existentes
    console.log('👥 VERIFICANDO USUARIOS:');
    console.log('-------------------------');
    
    const users = await dataSource.query('SELECT id, email, "firstName", "lastName", role, "tenantId" FROM users');
    console.log(`Usuarios encontrados: ${users.length}`);
    users.forEach((u: User) => {
      console.log(`  - ${u.email} (${u.role}) - Tenant: ${u.tenantId || 'N/A'}`);
    });
    console.log('');

    // 3. Verificar qué usuarios de los deseados existen
    console.log('🎯 VERIFICANDO USUARIOS DESEADOS:');
    console.log('-----------------------------------');
    
    for (const desiredUser of DESIRED_USERS) {
      const existingUser = users.find((u: User) => u.email === desiredUser.email);
      
      if (existingUser) {
        console.log(`✅ ${desiredUser.email} - YA EXISTE (rol: ${existingUser.role})`);
      } else {
        console.log(`❌ ${desiredUser.email} - NO EXISTE`);
        
        // Verificar si el tenant existe
        let tenant = tenants.find((t: Tenant) => t.id === desiredUser.tenantSlug);
        
        if (!tenant) {
          console.log(`   📝 Creando tenant: ${desiredUser.tenantName}...`);
          await dataSource.query(
            `INSERT INTO tenants (id, name, sector, country, currency, "createdAt", "updatedAt") 
             VALUES ($1, $2, $3, 'Colombia', 'COP', NOW(), NOW())`,
            [desiredUser.tenantSlug, desiredUser.tenantName, desiredUser.sector]
          );
          console.log(`   ✅ Tenant creado: ${desiredUser.tenantSlug}`);
        }

        // Crear el usuario
        console.log(`   📝 Creando usuario: ${desiredUser.email}...`);
        const hashedPassword = await bcrypt.hash(desiredUser.password, 10);
        
        await dataSource.query(
          `INSERT INTO users (id, email, "passwordHash", "firstName", "lastName", role, "tenantId", "isActive", "createdAt", "updatedAt") 
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, true, NOW(), NOW())`,
          [desiredUser.email, hashedPassword, 'Admin', 'Demo', 'admin', desiredUser.tenantSlug]
        );
        console.log(`   ✅ Usuario creado: ${desiredUser.email}`);
      }
    }

    // 4. Resumen final
    console.log('\n===========================================');
    console.log('📊 RESUMEN FINAL:');
    console.log('===========================================');
    
    const finalUsers = await dataSource.query('SELECT email, role, "tenantId" FROM users WHERE email LIKE $1', ['admin@%']);
    console.log('\nUsuarios admin disponibles:');
    finalUsers.forEach((u: User) => {
      console.log(`  📧 ${u.email} | Tenant: ${u.tenantId}`);
    });

    console.log('\n🔐 CREDENCIALES DE ACCESO:');
    console.log('-------------------------');
    for (const user of DESIRED_USERS) {
      console.log(`  ${user.email} / ${user.password}`);
    }

    console.log('\n✅ Proceso completado exitosamente!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

main();
