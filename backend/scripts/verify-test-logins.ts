/**
 * Script para verificar que los usuarios de prueba pueden hacer login
 * Uso: npx ts-node scripts/verify-test-logins.ts
 */

import axios from 'axios';

const API_URL = process.env.BACKEND_URL || 'https://nexora-app-production-3199.up.railway.app';

const API = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

interface TestUser {
  email: string;
  password: string;
  role: string;
  tenant: string;
}

const TEST_USERS: TestUser[] = [
  { email: 'superadmin@saas.com', password: 'Super123!', role: 'superadmin', tenant: 'system' },
  { email: 'admin@sabor.com', password: 'Admin123!', role: 'admin', tenant: 'restaurante-sabor' },
  { email: 'admin@sonrisa.com', password: 'Admin123!', role: 'admin', tenant: 'clinica-sonrisa' },
  { email: 'admin@fashion.com', password: 'Admin123!', role: 'admin', tenant: 'fashion-store' },
  { email: 'admin@estilo.com', password: 'Admin123!', role: 'admin', tenant: 'barberia-estilo' },
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
