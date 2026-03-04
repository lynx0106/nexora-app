/**
 * Script para verificar que los usuarios de prueba pueden hacer login
 * Uso: npx ts-node scripts/verify-test-logins.ts
 * 
 * Variables de entorno:
 * - SEED_SUPERADMIN_PASSWORD: Contraseña del superadmin
 * - SEED_ADMIN_PASSWORD: Contraseña para admins
 */

import axios from 'axios';

const API_URL = process.env.BACKEND_URL || 'https://nexora-app-production-3104.up.railway.app';

const API = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Origin': API_URL,
    'Referer': API_URL + '/',
  },
});

// Use environment variables for passwords - NO FALLBACKS for security
const SUPERADMIN_PASSWORD = process.env.SEED_SUPERADMIN_PASSWORD;
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;

// Validate required environment variables
if (!SUPERADMIN_PASSWORD || !ADMIN_PASSWORD) {
  console.error('❌ Error: Se requieren las siguientes variables de entorno:');
  console.error('   - SEED_SUPERADMIN_PASSWORD');
  console.error('   - SEED_ADMIN_PASSWORD');
  process.exit(1);
}

interface TestUser {
  email: string;
  password: string;
  role: string;
  tenant: string;
}

const TEST_USERS: TestUser[] = [
  { email: 'superadmin@saas.com', password: SUPERADMIN_PASSWORD, role: 'superadmin', tenant: 'system' },
  { email: 'admin@sabor.com', password: ADMIN_PASSWORD, role: 'admin', tenant: 'restaurante-sabor' },
  { email: 'admin@sonrisa.com', password: ADMIN_PASSWORD, role: 'admin', tenant: 'clinica-sonrisa' },
  { email: 'admin@fashion.com', password: ADMIN_PASSWORD, role: 'admin', tenant: 'fashion-store' },
  { email: 'admin@estilo.com', password: ADMIN_PASSWORD, role: 'admin', tenant: 'barberia-estilo' },
];

async function testLogin(user: TestUser): Promise<boolean> {
  try {
    const res = await API.post('/auth/login', {
      email: user.email,
      password: user.password,
    });
    return res.data.access_token ? true : false;
  } catch (error: any) {
    console.log('   Error completo:', error);
    return false;
  }
}

async function main() {
  console.log('===========================================');
  console.log('🔐 VERIFICACIÓN DE LOGIN - USUARIOS DE PRUEBA');
  console.log('===========================================');
  console.log(`📡 Conectando a: ${API_URL}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const user of TEST_USERS) {
    const success = await testLogin(user);
    if (success) {
      console.log(`✅ ${user.role.padEnd(12)} | ${user.email.padEnd(30)} | Login exitoso`);
      successCount++;
    } else {
      console.log(`❌ ${user.role.padEnd(12)} | ${user.email.padEnd(30)} | Error de login`);
      failCount++;
    }
  }

  console.log('\n===========================================');
  console.log('📊 RESUMEN:');
  console.log(`   ✅ Exitosos: ${successCount}`);
  console.log(`   ❌ Fallidos: ${failCount}`);
  console.log('===========================================');

  if (failCount === 0) {
    console.log('\n🎉 Todos los usuarios pueden hacer login correctamente!');
  } else {
    console.log('\n⚠️ Algunos usuarios no pueden hacer login.');
  }
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
