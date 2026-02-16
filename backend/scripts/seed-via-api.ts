/**
 * Script para ejecutar seed de datos de prueba via API
 * Uso: npx ts-node scripts/seed-via-api.ts
 * 
 * Requiere variable de entorno: BACKEND_URL
 * Ejemplo: BACKEND_URL=https://tu-backend.railway.app npx ts-node scripts/seed-via-api.ts
 */

import axios from 'axios';

const API_URL = process.env.BACKEND_URL || 'http://localhost:4001';

const API = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Credenciales del superadmin (debe existir primero)
const SUPERADMIN_EMAIL = 'superadmin@saas.com';
const SUPERADMIN_PASSWORD = 'Super123!';

let authToken = '';

async function loginSuperadmin() {
  console.log('🔐 Iniciando sesión como superadmin...');
  try {
    const res = await API.post('/auth/login', {
      email: SUPERADMIN_EMAIL,
      password: SUPERADMIN_PASSWORD,
    });
    authToken = res.data.access_token;
    API.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
    console.log('✅ Sesión iniciada correctamente');
    return true;
  } catch (error: any) {
    console.error('❌ Error al iniciar sesión:', error.response?.data?.message || error.message);
    return false;
  }
}

async function seedSuperadmin() {
  console.log('🌱 Creando superadmin seed...');
  try {
    await API.post('/users/seed-superadmin');
    console.log('✅ Superadmin creado/verificado');
  } catch (error: any) {
    console.log('ℹ️ Superadmin ya existe o error:', error.response?.data?.message || error.message);
  }
}

async function seedDemoUsers() {
  console.log('👥 Creando usuarios demo...');
  try {
    const res = await API.post('/users/seed-demo-users');
    console.log(`✅ Usuarios demo creados: ${res.data.count || 'OK'}`);
  } catch (error: any) {
    console.log('ℹ️ Usuarios demo:', error.response?.data?.message || error.message);
  }
}

async function createTestTenant(tenantId: string, name: string, sector: string) {
  console.log(`🏢 Creando tenant: ${name}...`);
  try {
    const res = await API.post('/tenants', {
      id: tenantId,
      name: name,
      sector: sector,
      country: 'Colombia',
      currency: 'COP',
    });
    console.log(`✅ Tenant ${name} creado: ${res.data.id}`);
    return res.data;
  } catch (error: any) {
    if (error.response?.status === 409) {
      console.log(`ℹ️ Tenant ${name} ya existe`);
      return { id: tenantId };
    }
    console.error(`❌ Error creando tenant ${name}:`, error.response?.data?.message || error.message);
    return null;
  }
}

async function seedProducts(tenantId: string, tenantName: string) {
  console.log(`📦 Creando productos para ${tenantName}...`);
  try {
    await API.post(`/products/seed/${tenantId}`);
    console.log(`✅ Productos creados para ${tenantName}`);
  } catch (error: any) {
    console.log(`ℹ️ Productos para ${tenantName}:`, error.response?.data?.message || error.message);
  }
}

async function seedDoctors(tenantId: string) {
  console.log('👨‍⚕️ Creando doctores...');
  try {
    await API.post(`/users/seed-doctors/${tenantId}`);
    console.log('✅ Doctores creados');
  } catch (error: any) {
    console.log('ℹ️ Doctores:', error.response?.data?.message || error.message);
  }
}

async function seedClients(tenantId: string) {
  console.log('👤 Creando clientes...');
  try {
    await API.post(`/users/seed-clients/${tenantId}`);
    console.log('✅ Clientes creados');
  } catch (error: any) {
    console.log('ℹ️ Clientes:', error.response?.data?.message || error.message);
  }
}

async function createTestOrders(tenantId: string, productIds: string[]) {
  console.log('🛒 Creando pedidos de prueba...');
  try {
    for (let i = 0; i < 3; i++) {
      const randomProduct = productIds[Math.floor(Math.random() * productIds.length)];
      await API.post(`/public/orders/${tenantId}`, {
        items: [{ productId: randomProduct, quantity: Math.floor(Math.random() * 3) + 1 }],
        clientFirstName: 'Cliente',
        clientLastName: `Prueba ${i + 1}`,
        clientEmail: `cliente${i + 1}@test.com`,
        clientPhone: '3001234567',
      });
    }
    console.log('✅ Pedidos de prueba creados');
  } catch (error: any) {
    console.log('ℹ️ Pedidos:', error.response?.data?.message || error.message);
  }
}

async function createTestAppointments(tenantId: string, serviceIds: string[]) {
  console.log('📅 Creando citas de prueba...');
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10 + Math.floor(Math.random() * 6), 0, 0, 0);

    for (let i = 0; i < 3; i++) {
      const randomService = serviceIds[Math.floor(Math.random() * serviceIds.length)];
      const appointmentTime = new Date(tomorrow);
      appointmentTime.setHours(appointmentTime.getHours() + i * 2);

      await API.post(`/public/appointments/${tenantId}`, {
        serviceId: randomService,
        date: appointmentTime.toISOString(),
        clientFirstName: 'Cliente',
        clientLastName: `Cita ${i + 1}`,
        clientEmail: `citacliente${i + 1}@test.com`,
        clientPhone: '3001234567',
        notes: 'Cita de prueba',
      });
    }
    console.log('✅ Citas de prueba creadas');
  } catch (error: any) {
    console.log('ℹ️ Citas:', error.response?.data?.message || error.message);
  }
}

async function main() {
  console.log('===========================================');
  console.log('🚀 NEXORA APP - SEED DE DATOS DE PRUEBA');
  console.log('===========================================');
  console.log(`📡 Conectando a: ${API_URL}`);
  console.log('');

  try {
    // 1. Crear/verificar superadmin
    await seedSuperadmin();

    // 2. Intentar login (si el superadmin existe)
    const loggedIn = await loginSuperadmin();
    
    if (!loggedIn) {
      console.log('\n⚠️ No se puede iniciar sesión. Asegúrate de que:');
      console.log('   1. El backend esté corriendo');
      console.log('   2. Las credenciales sean correctas');
      console.log('   3. La URL del backend sea correcta');
      process.exit(1);
    }

    // 3. Crear usuarios demo
    await seedDemoUsers();

    // 4. Crear tenants de prueba
    const tenants = [
      { id: 'restaurante-demo', name: 'Restaurante Demo', sector: 'restaurante' },
      { id: 'clinica-demo', name: 'Clínica Demo', sector: 'salud' },
      { id: 'tienda-demo', name: 'Tienda Demo', sector: 'retail' },
      { id: 'belleza-demo', name: 'Belleza Demo', sector: 'belleza' },
    ];

    for (const tenant of tenants) {
      const created = await createTestTenant(tenant.id, tenant.name, tenant.sector);
      if (created) {
        await seedProducts(tenant.id, tenant.name);
        
        // Seed doctores para clínicas
        if (tenant.sector === 'salud') {
          await seedDoctors(tenant.id);
        }
        
        // Seed clientes para todos
        await seedClients(tenant.id);

        // Crear pedidos y citas de prueba
        await createTestOrders(tenant.id, []);
        await createTestAppointments(tenant.id, []);
      }
    }

    console.log('');
    console.log('===========================================');
    console.log('✅ SEED COMPLETADO EXITOSAMENTE');
    console.log('===========================================');
    console.log('');
    console.log('📋 CREDENCIALES DE PRUEBA:');
    console.log('');
    console.log('👑 SUPERADMIN:');
    console.log('   Email: superadmin@saas.com');
    console.log('   Password: Super123!');
    console.log('');
    console.log('👨‍💼 ADMIN (cada tenant):');
    console.log('   Email: admin@[tenant].com');
    console.log('   Password: Admin123!');
    console.log('');
    console.log('👤 USUARIO/CLIENTE:');
    console.log('   Email: cliente@test.com');
    console.log('   Password: Client123!');
    console.log('');
    console.log('🌐 FRONTEND: https://nexora-app.online');
    console.log('🔧 BACKEND:', API_URL);

  } catch (error: any) {
    console.error('\n❌ Error en el seed:', error.message);
    process.exit(1);
  }
}

main();
