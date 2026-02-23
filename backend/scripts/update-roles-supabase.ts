/**
 * Script para actualizar roles de usuarios en Supabase
 * Uso: npx ts-node scripts/update-roles-supabase.ts
 * 
 * Variables de entorno requeridas:
 * - SUPABASE_HOST: Host de Supabase (ej: aws-1-us-east-1.pooler.supabase.com)
 * - SUPABASE_PORT: Puerto de Supabase (ej: 5432)
 * - SUPABASE_USERNAME: Usuario de la base de datos
 * - SUPABASE_PASSWORD: Contraseña de la base de datos
 * - SUPABASE_DATABASE: Nombre de la base de datos (ej: postgres)
 */

import { DataSource } from 'typeorm';

// Validar que todas las variables de entorno requeridas estén presentes
const requiredEnvVars = [
  'SUPABASE_HOST',
  'SUPABASE_PORT',
  'SUPABASE_USERNAME',
  'SUPABASE_PASSWORD',
  'SUPABASE_DATABASE',
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Falta la variable de entorno: ${envVar}`);
  }
}

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.SUPABASE_HOST,
  port: parseInt(process.env.SUPABASE_PORT!, 10),
  username: process.env.SUPABASE_USERNAME,
  password: process.env.SUPABASE_PASSWORD,
  database: process.env.SUPABASE_DATABASE,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function main() {
  console.log('===========================================');
  console.log('🔄 ACTUALIZANDO ROLES DE USUARIOS');
  console.log('===========================================\n');

  try {
    await dataSource.initialize();
    console.log('✅ Conectado a Supabase\n');

    // Actualizar roles
    const result = await dataSource.query(`
      UPDATE users 
      SET role = 'admin', "updatedAt" = NOW() 
      WHERE email IN ('admin@restaurant.com', 'admin@dental.com', 'admin@barbershop.com')
    `);
    
    console.log(`✅ Usuarios actualizados: ${result.rowCount || result.length || 'N/A'}`);

    // Verificar los cambios
    const users = await dataSource.query(`
      SELECT email, role, "tenantId" 
      FROM users 
      WHERE email IN ('admin@restaurant.com', 'admin@dental.com', 'admin@barbershop.com')
    `);

    console.log('\n📋 USUARIOS ACTUALIZADOS:');
    console.log('-------------------------');
    users.forEach((u: any) => {
      console.log(`  ✅ ${u.email} | Rol: ${u.role} | Tenant: ${u.tenantId}`);
    });

    console.log('\n✅ Proceso completado exitosamente!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

main();
