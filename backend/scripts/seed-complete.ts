/**
 * Script para crear datos de prueba completos
 * Uso: npx ts-node scripts/seed-complete.ts
 * 
 * Variables de entorno requeridas:
 * - SEED_superAdminPassword: Contraseña del superadmin (default: SuperAdmin2024!)
 * - SEED_demoPassword: Contraseña para usuarios demo (default: Demo123!)
 */

import axios from 'axios';

const API_URL = process.env.BACKEND_URL || 'https://nexora-app-production-3104.up.railway.app';

// Use environment variables for passwords - NO FALLBACKS for security
// Using non-null assertion (!) after validation since we exit if undefined
const superAdminPassword = process.env.SEED_superAdminPassword!;
const demoPassword = process.env.SEED_demoPassword!;

// Validate required environment variables
if (!superAdminPassword || !demoPassword) {
  console.error('❌ Error: Se requieren las siguientes variables de entorno:');
  console.error('   - SEED_superAdminPassword');
  console.error('   - SEED_demoPassword');
  process.exit(1);
}

const API = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

let authToken = '';

async function login() {
  console.log('🔐 Iniciando sesión...');
  const res = await API.post('/auth/login', {
    email: 'superadmin@saas.com',
    password: superAdminPassword,
  });
  authToken = res.data.access_token;
  API.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  console.log('✅ Sesión iniciada');
}

async function createUser(tenantId: string, email: string, firstName: string, lastName: string, role: string = 'user') {
  try {
    const res = await API.post('/users', {
      email,
      password: demoPassword,
      firstName,
      lastName,
      role,
      tenantId,
    });
    console.log(`✅ Usuario creado: ${email} (${role})`);
    return res.data;
  } catch (error: any) {
    if (error.response?.status === 409) {
      console.log(`ℹ️ Usuario ya existe: ${email}`);
      return null;
    }
    console.log(`❌ Error creando usuario ${email}:`, error.response?.data?.message || error.message);
    return null;
  }
}

async function createProduct(tenantId: string, name: string, price: number, category: string) {
  try {
    const res = await API.post('/products', {
      tenantId,
      name,
      price,
      category,
      isAvailable: true,
      stock: 100,
    });
    console.log(`✅ Producto creado: ${name}`);
    return res.data;
  } catch (error: any) {
    console.log(`❌ Error creando producto ${name}:`, error.response?.data?.message || error.message);
    return null;
  }
}

async function createOrder(tenantId: string, productId: string, clientName: string, clientEmail: string) {
  try {
    const res = await API.post(`/public/orders/${tenantId}`, {
      items: [{ productId, quantity: 1 }],
      clientFirstName: clientName.split(' ')[0],
      clientLastName: clientName.split(' ').slice(1).join(' ') || 'Cliente',
      clientEmail,
      clientPhone: '3001234567',
    });
    console.log(`✅ Pedido creado para ${clientName}`);
    return res.data;
  } catch (error: any) {
    console.log(`❌ Error creando pedido:`, error.response?.data?.message || error.message);
    return null;
  }
}

async function createAppointment(tenantId: string, serviceId: string, clientName: string, clientEmail: string, date: Date) {
  try {
    const res = await API.post(`/public/appointments/${tenantId}`, {
      serviceId,
      date: date.toISOString(),
      clientFirstName: clientName.split(' ')[0],
      clientLastName: clientName.split(' ').slice(1).join(' ') || 'Cliente',
      clientEmail,
      clientPhone: '3001234567',
      notes: 'Cita de prueba',
    });
    console.log(`✅ Cita creada para ${clientName}`);
    return res.data;
  } catch (error: any) {
    console.log(`❌ Error creando cita:`, error.response?.data?.message || error.message);
    return null;
  }
}

async function main() {
  console.log('===========================================');
  console.log('🚀 SEED COMPLETO - DATOS DE PRUEBA');
  console.log('===========================================');

  await login();

  // ============================================
  // RESTAURANTE DEMO
  // ============================================
  console.log('\n🍽️ Creando datos para RESTAURANTE DEMO...');
  
  const restUsers = await Promise.all([
    createUser('restaurante-demo', 'carlos.mesero@restaurante-demo.com', 'Carlos', 'Mesero', 'user'),
    createUser('restaurante-demo', 'maria.caja@restaurante-demo.com', 'Maria', 'Caja', 'user'),
    createUser('restaurante-demo', 'juan.cliente@restaurante-demo.com', 'Juan', 'Cliente', 'user'),
  ]);

  const restProducts = await Promise.all([
    createProduct('restaurante-demo', 'Hamburguesa Clásica', 15000, 'combos'),
    createProduct('restaurante-demo', 'Papas Fritas', 8000, 'acompanamientos'),
    createProduct('restaurante-demo', 'Gaseosa 500ml', 5000, 'bebidas'),
  ]);

  if (restProducts[0]) {
    await createOrder('restaurante-demo', restProducts[0].id, 'Juan Cliente', 'juan.cliente@restaurante-demo.com');
    await createOrder('restaurante-demo', restProducts[1].id, 'Pedro Perez', 'pedro@email.com');
  }

  // ============================================
  // CLINICA DENTAL DEMO
  // ============================================
  console.log('\n🦷 Creando datos para CLÍNICA DENTAL DEMO...');
  
  const clinicaUsers = await Promise.all([
    createUser('clinica-demo', 'dr.fernando@clinica-demo.com', 'Dr. Fernando', 'Ortiz', 'user'),
    createUser('clinica-demo', 'dr.ana@clinica-demo.com', 'Dra. Ana', 'López', 'user'),
    createUser('clinica-demo', 'maria.paciente@clinica-demo.com', 'Maria', 'Paciente', 'user'),
  ]);

  const clinicaProducts = await Promise.all([
    createProduct('clinica-demo', 'Limpieza Dental', 80000, 'servicios'),
    createProduct('clinica-demo', 'Ortodoncia', 1500000, 'servicios'),
    createProduct('clinica-demo', 'Blanqueamiento', 300000, 'servicios'),
  ]);

  if (clinicaProducts[0]) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    
    await createAppointment('clinica-demo', clinicaProducts[0].id, 'Maria Paciente', 'maria.paciente@clinica-demo.com', tomorrow);
    
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(dayAfter.getDate() + 1);
    await createAppointment('clinica-demo', clinicaProducts[2].id, 'Roberto Gomez', 'roberto@email.com', dayAfter);
  }

  // ============================================
  // TIENDA RETAIL DEMO
  // ============================================
  console.log('\n🏪 Creando datos para TIENDA RETAIL DEMO...');
  
  const tiendaUsers = await Promise.all([
    createUser('tienda-demo', 'sofia.vendedora@tienda-demo.com', 'Sofia', 'Vendedora', 'user'),
    createUser('tienda-demo', 'luis.bodeguero@tienda-demo.com', 'Luis', 'Bodeguero', 'user'),
    createUser('tienda-demo', 'laura.compradora@tienda-demo.com', 'Laura', 'Compradora', 'user'),
  ]);

  const tiendaProducts = await Promise.all([
    createProduct('tienda-demo', 'Camisa Roja', 45000, 'ropa'),
    createProduct('tienda-demo', 'Pantalón Azul', 65000, 'ropa'),
    createProduct('tienda-demo', 'Zapatos Negros', 120000, 'calzado'),
  ]);

  if (tiendaProducts[0]) {
    await createOrder('tienda-demo', tiendaProducts[0].id, 'Laura Compradora', 'laura.compradora@tienda-demo.com');
    await createOrder('tienda-demo', tiendaProducts[2].id, 'Marco Soto', 'marco@email.com');
  }

  // ============================================
  // SALON BELLEZA DEMO
  // ============================================
  console.log('\💄 Creando datos para SALÓN BELLEZA DEMO...');
  
  const bellezaUsers = await Promise.all([
    createUser('belleza-demo', 'rosa.peinadora@belleza-demo.com', 'Rosa', 'Peinadora', 'user'),
    createUser('belleza-demo', 'elena.estilista@belleza-demo.com', 'Elena', 'Estilista', 'user'),
    createUser('belleza-demo', 'cliente.belleza@belleza-demo.com', 'Cliente', 'Belleza', 'user'),
  ]);

  const bellezaProducts = await Promise.all([
    createProduct('belleza-demo', 'Corte de Cabello', 25000, 'servicios'),
    createProduct('belleza-demo', 'Coloración', 80000, 'servicios'),
    createProduct('belleza-demo', 'Manicure', 35000, 'servicios'),
  ]);

  if (bellezaProducts[0]) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    
    await createAppointment('belleza-demo', bellezaProducts[0].id, 'Cliente Belleza', 'cliente.belleza@belleza-demo.com', tomorrow);
  }

  console.log('\n===========================================');
  console.log('✅ SEED COMPLETADO');
  console.log('===========================================');
  console.log('\n📋 RESUMEN:');
  console.log('- Restaurante: 3 usuarios, 3 productos, 2 pedidos');
  console.log('- Clínica: 3 usuarios, 3 servicios, 2 citas');
  console.log('- Tienda: 3 usuarios, 3 productos, 2 pedidos');
  console.log('- Belleza: 3 usuarios, 3 servicios, 1 cita');
}

main();
