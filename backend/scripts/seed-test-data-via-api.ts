/**
 * Script para crear datos de prueba completos para testing de App Móvil Nexora
 * Usa la API REST del backend (no requiere acceso directo a DB)
 * Uso: npx ts-node scripts/seed-test-data-via-api.ts
 * 
 * Variables de entorno requeridas:
 * - SEED_SUPERADMIN_PASSWORD: Contraseña del superadmin
 * - SEED_TEST_PASSWORD: Contraseña para usuarios de prueba
 *
 * Crea:
 * - 1 Superadmin
 * - 4 Empresas (Tenants) con datos completos
 * - Usuarios admin y staff para cada empresa
 * - Productos/Servicios
 * - Pedidos/Citas de prueba
 */

import axios from 'axios';

const API_URL = process.env.BACKEND_URL || 'https://nexora-app-production-3104.up.railway.app';

const API = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Use environment variables for passwords - NO FALLBACKS for security
const SUPERADMIN_PASSWORD = process.env.SEED_SUPERADMIN_PASSWORD;
const TEST_PASSWORD = process.env.SEED_TEST_PASSWORD;

// Validate required environment variables and assert they are non-null
if (!SUPERADMIN_PASSWORD || !TEST_PASSWORD) {
  console.error('❌ Error: Se requieren las siguientes variables de entorno:');
  console.error('   - SEED_SUPERADMIN_PASSWORD');
  console.error('   - SEED_TEST_PASSWORD');
  process.exit(1);
}

// Using non-null assertion (!) after validation since we exit if undefined
const superAdminPassword = process.env.SEED_SUPERADMIN_PASSWORD!;
const testPassword = process.env.SEED_TEST_PASSWORD!;

interface TestTenant {
  id: string;
  name: string;
  sector: string;
  adminEmail: string;
  staff: Array<{
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  }>;
  products: Array<{
    name: string;
    description: string;
    price: number;
    duration?: number;
    stock?: number;
  }>;
  isServiceBased: boolean;
}

const TEST_TENANTS: TestTenant[] = [
  {
    id: 'restaurante-sabor',
    name: 'Restaurante El Sabor',
    sector: 'restaurante',
    adminEmail: 'admin@sabor.com',
    staff: [
      { email: 'mesero1@sabor.com', firstName: 'Carlos', lastName: 'Mesero', role: 'user' },
      { email: 'cocina@sabor.com', firstName: 'Maria', lastName: 'Cocina', role: 'user' },
      { email: 'caja@sabor.com', firstName: 'Juan', lastName: 'Caja', role: 'user' },
    ],
    products: [
      { name: 'Bandeja Paisa', description: 'Arroz, frijoles, carne molida, chicharrón, huevo, aguacate y arepa', price: 25000, stock: 50 },
      { name: 'Ajiaco Santafereño', description: 'Sopa tradicional con pollo, mazorca, papa y alcaparras', price: 18000, stock: 30 },
      { name: 'Empanadas Colombianas', description: 'Empanadas de carne y papa (3 unidades)', price: 8000, stock: 100 },
      { name: 'Arepa con Queso', description: 'Arepa asada con queso derretido', price: 5000, stock: 80 },
      { name: 'Churrasco', description: 'Carne a la parrilla con papas y ensalada', price: 32000, stock: 40 },
      { name: 'Pescado Frito', description: 'Mojarra frita con arroz de coco y patacones', price: 28000, stock: 25 },
      { name: 'Limonada Natural', description: 'Limonada con hierbabuena', price: 6000, stock: 200 },
      { name: 'Jugo de Mango', description: 'Jugo natural de mango en leche o agua', price: 7000, stock: 150 },
      { name: 'Cerveza Nacional', description: 'Cerveza águila o club colombia', price: 5000, stock: 300 },
      { name: 'Postre de Tres Leches', description: 'Torta de tres leches con arequipe', price: 9000, stock: 40 },
      { name: 'Flan de Caramelo', description: 'Flan casero con salsa de caramelo', price: 7500, stock: 35 },
      { name: 'Sopa de Lentejas', description: 'Sopa de lentejas con verduras', price: 12000, stock: 45 },
      { name: 'Pollo a la Plancha', description: 'Pechuga de pollo con vegetales salteados', price: 22000, stock: 60 },
      { name: 'Arroz con Pollo', description: 'Arroz amarillo con pollo desmechado y verduras', price: 20000, stock: 55 },
      { name: 'Gaseosa 400ml', description: 'Coca-cola, sprite o postobón', price: 4500, stock: 500 },
    ],
    isServiceBased: false,
  },
  {
    id: 'clinica-sonrisa',
    name: 'Clínica Dental Sonrisa Perfecta',
    sector: 'salud',
    adminEmail: 'admin@sonrisa.com',
    staff: [
      { email: 'doctor@sonrisa.com', firstName: 'Dr. Fernando', lastName: 'Gómez', role: 'user' },
      { email: 'recepcion@sonrisa.com', firstName: 'Ana', lastName: 'Recepción', role: 'user' },
      { email: 'asistente@sonrisa.com', firstName: 'Laura', lastName: 'Asistente', role: 'user' },
    ],
    products: [
      { name: 'Limpieza Dental Profunda', description: 'Eliminación de placa y sarro, pulido dental', price: 80000, duration: 60 },
      { name: 'Blanqueamiento Dental', description: 'Blanqueamiento profesional con lámpara LED', price: 350000, duration: 90 },
      { name: 'Ortodoncia Brackets', description: 'Instalación de brackets metálicos', price: 2800000, duration: 120 },
      { name: 'Ortodoncia Invisible', description: 'Alineadores transparentes Invisalign', price: 4500000, duration: 60 },
      { name: 'Implante Dental', description: 'Implante de titanio con corona', price: 2500000, duration: 180 },
      { name: 'Endodoncia', description: 'Tratamiento de conducto', price: 450000, duration: 90 },
      { name: 'Extracción Simple', description: 'Extracción de pieza dental', price: 120000, duration: 45 },
      { name: 'Extracción de Muela del Juicio', description: 'Cirugía de terceros molares', price: 450000, duration: 120 },
      { name: 'Corona Dental', description: 'Corona en porcelana o zirconio', price: 850000, duration: 60 },
      { name: 'Puente Dental', description: 'Puente fijo de 3 unidades', price: 2200000, duration: 90 },
      { name: 'Prótesis Removible', description: 'Prótesis parcial o completa', price: 1200000, duration: 60 },
      { name: 'Carillas de Porcelana', description: 'Carillas estéticas (por unidad)', price: 950000, duration: 60 },
    ],
    isServiceBased: true,
  },
  {
    id: 'fashion-store',
    name: 'Fashion Store',
    sector: 'retail',
    adminEmail: 'admin@fashion.com',
    staff: [
      { email: 'vendedor@fashion.com', firstName: 'Pedro', lastName: 'Vendedor', role: 'user' },
      { email: 'cajera@fashion.com', firstName: 'Sofia', lastName: 'Cajera', role: 'user' },
      { email: 'bodega@fashion.com', firstName: 'Diego', lastName: 'Bodega', role: 'user' },
    ],
    products: [
      { name: 'Camiseta Básica Blanca', description: 'Camiseta 100% algodón', price: 45000, stock: 100 },
      { name: 'Camiseta Básica Negra', description: 'Camiseta 100% algodón', price: 45000, stock: 100 },
      { name: 'Jeans Slim Fit Azul', description: 'Jeans ajustados color azul oscuro', price: 120000, stock: 60 },
      { name: 'Jeans Clásico Negro', description: 'Jeans corte clásico negro', price: 115000, stock: 55 },
      { name: 'Chaqueta de Cuero', description: 'Chaqueta sintética tipo cuero', price: 180000, stock: 30 },
      { name: 'Sudadera con Capucha', description: 'Hoodie en algodón', price: 95000, stock: 80 },
      { name: 'Vestido Casual', description: 'Vestido de verano estampado', price: 85000, stock: 45 },
      { name: 'Blusa Elegante', description: 'Blusa para ocasión formal', price: 75000, stock: 50 },
      { name: 'Zapatos Deportivos', description: 'Tenis running', price: 180000, stock: 40 },
      { name: 'Zapatos Formales', description: 'Zapatos de cuero para oficina', price: 220000, stock: 35 },
      { name: 'Sandalias', description: 'Sandalias de verano', price: 65000, stock: 70 },
      { name: 'Cinturón de Cuero', description: 'Cinturón genuino negro y café', price: 55000, stock: 90 },
      { name: 'Gorra Snapback', description: 'Gorra ajustable varios colores', price: 45000, stock: 120 },
      { name: 'Bufanda de Lana', description: 'Bufanda tejida', price: 38000, stock: 60 },
      { name: 'Medias Pack x3', description: 'Pack de medias deportivas', price: 25000, stock: 200 },
    ],
    isServiceBased: false,
  },
  {
    id: 'barberia-estilo',
    name: 'Barbería Estilo Urbano',
    sector: 'belleza',
    adminEmail: 'admin@estilo.com',
    staff: [
      { email: 'barbero1@estilo.com', firstName: 'Luis', lastName: 'Barbero', role: 'user' },
      { email: 'barbero2@estilo.com', firstName: 'Andrés', lastName: 'Estilista', role: 'user' },
      { email: 'recepcion@estilo.com', firstName: 'Camila', lastName: 'Recepción', role: 'user' },
    ],
    products: [
      { name: 'Corte Clásico', description: 'Corte de cabello tradicional con tijera', price: 25000, duration: 45 },
      { name: 'Corte Moderno', description: 'Corte con diseño y degradado', price: 30000, duration: 60 },
      { name: 'Afeitado Tradicional', description: 'Afeitado con navaja y toalla caliente', price: 20000, duration: 30 },
      { name: 'Afeitado con Diseño', description: 'Afeitado con diseño de barba', price: 28000, duration: 45 },
      { name: 'Arreglo de Barba', description: 'Perfilado y cuidado de barba', price: 18000, duration: 30 },
      { name: 'Corte + Barba', description: 'Combo corte de cabello y arreglo de barba', price: 40000, duration: 75 },
      { name: 'Tratamiento Facial', description: 'Limpieza facial para hombres', price: 35000, duration: 45 },
      { name: 'Coloración', description: 'Tinte de cabello completo', price: 55000, duration: 90 },
      { name: 'Mechas/Reflejos', description: 'Mechas o reflejos en cabello', price: 75000, duration: 120 },
      { name: 'Tratamiento Capilar', description: 'Hidratación y tratamiento profundo', price: 45000, duration: 60 },
      { name: 'Corte Infantil', description: 'Corte para niños hasta 12 años', price: 20000, duration: 40 },
      { name: 'Paquete Novio', description: 'Corte, afeitado, facial y styling', price: 85000, duration: 120 },
    ],
    isServiceBased: true,
  },
];

let authToken = '';

async function loginSuperadmin() {
  console.log('🔐 Iniciando sesión como superadmin...');
  try {
    const res = await API.post('/auth/login', {
      email: 'superadmin@saas.com',
      password: superAdminPassword,
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

async function createTenant(tenantId: string, name: string, sector: string, adminEmail: string) {
  console.log(`🏢 Creando tenant: ${name}...`);
  try {
    // Usar el endpoint register que no requiere autenticación
    const res = await API.post('/tenants/register', {
      name: name,
      sector: sector,
      country: 'Colombia',
      currency: 'COP',
      adminEmail: adminEmail,
      adminFirstName: 'Admin',
      adminLastName: name.split(' ').slice(-1)[0] || 'Admin',
      adminPassword: testPassword,
    });
    console.log(`✅ Tenant creado: ${tenantId}`);
    return res.data;
  } catch (error: any) {
    if (error.response?.status === 409) {
      console.log(`ℹ️ Tenant ${tenantId} ya existe`);
      return { id: tenantId };
    }
    console.error(`❌ Error creando tenant ${tenantId}:`, error.response?.data?.message || error.message);
    return null;
  }
}

async function createUser(tenantId: string, email: string, firstName: string, lastName: string, role: string = 'user') {
  try {
    const res = await API.post('/users', {
      email,
      password: testPassword,
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

async function createProduct(tenantId: string, productData: any) {
  try {
    const res = await API.post('/products', {
      tenantId,
      name: productData.name,
      description: productData.description,
      price: productData.price,
      duration: productData.duration,
      stock: productData.stock || 0,
      isAvailable: true,
    });
    console.log(`  ✅ Producto creado: ${productData.name}`);
    return res.data;
  } catch (error: any) {
    console.log(`  ❌ Error creando producto ${productData.name}:`, error.response?.data?.message || error.message);
    return null;
  }
}

async function createOrder(tenantId: string, productId: string, clientName: string, clientEmail: string) {
  try {
    const res = await API.post(`/public/orders/${tenantId}`, {
      items: [{ productId, quantity: Math.floor(Math.random() * 3) + 1 }],
      clientFirstName: clientName.split(' ')[0],
      clientLastName: clientName.split(' ').slice(1).join(' ') || 'Cliente',
      clientEmail,
      clientPhone: '3001234567',
    });
    console.log(`  ✅ Pedido creado para ${clientName}`);
    return res.data;
  } catch (error: any) {
    console.log(`  ❌ Error creando pedido:`, error.response?.data?.message || error.message);
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
    console.log(`  ✅ Cita creada para ${clientName}`);
    return res.data;
  } catch (error: any) {
    console.log(`  ❌ Error creando cita:`, error.response?.data?.message || error.message);
    return null;
  }
}

async function main() {
  console.log('===========================================');
  console.log('🚀 NEXORA - SEED DE DATOS DE PRUEBA (API)');
  console.log('===========================================');
  console.log(`📡 Conectando a: ${API_URL}`);
  console.log('');

  // 1. Intentar login como superadmin existente
  let loggedIn = await loginSuperadmin();
  
  if (!loggedIn) {
    console.log('\n⚠️ No se pudo iniciar sesión. Asegúrate de que:');
    console.log('   1. El backend esté corriendo');
    console.log('   2. El superadmin superadmin@saas.com exista con password ' + superAdminPassword);
    console.log('   3. La URL del backend sea correcta');
    process.exit(1);
  }

  const createdUsers: Array<{ email: string; password: string; role: string; tenant: string }> = [];

  // Agregar superadmin a la lista
  createdUsers.push({ email: 'superadmin@saas.com', password: superAdminPassword, role: 'superadmin', tenant: 'system' });

  // 2. Crear tenants y sus datos
  for (const tenantData of TEST_TENANTS) {
    console.log(`\n🏢 Procesando: ${tenantData.name}`);

    // 2.1 Crear tenant
    const tenant = await createTenant(tenantData.id, tenantData.name, tenantData.sector, tenantData.adminEmail);
    if (!tenant) {
      console.log(`❌ Error creando tenant ${tenantData.id}, saltando...`);
      continue;
    }
    createdUsers.push({ email: tenantData.adminEmail, password: testPassword, role: 'admin', tenant: tenantData.id });

    // 2.2 Crear usuarios staff
    for (const staff of tenantData.staff) {
      await createUser(tenantData.id, staff.email, staff.firstName, staff.lastName, staff.role);
      createdUsers.push({ email: staff.email, password: testPassword, role: staff.role, tenant: tenantData.id });
    }

    // 2.3 Crear productos/servicios
    const createdProducts: any[] = [];
    for (const productData of tenantData.products) {
      const product = await createProduct(tenantData.id, productData);
      if (product) {
        createdProducts.push(product);
      }
    }
    console.log(`  ✅ ${createdProducts.length} productos/servicios creados`);

    // 2.4 Crear pedidos/citas de prueba
    if (tenantData.isServiceBased && createdProducts.length > 0) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      for (let i = 0; i < 8; i++) {
        const service = createdProducts[i % createdProducts.length];
        const appointmentDate = new Date(tomorrow);
        appointmentDate.setDate(appointmentDate.getDate() + Math.floor(i / 2));
        appointmentDate.setHours(9 + (i % 6), 0, 0, 0);

        await createAppointment(tenantData.id, service.id, `Cliente${i + 1} Prueba`, `cliente${i + 1}@test.com`, appointmentDate);
      }
      console.log(`  ✅ Citas de prueba creadas`);
    } else if (createdProducts.length > 0) {
      for (let i = 0; i < 8; i++) {
        const product = createdProducts[i % createdProducts.length];
        await createOrder(tenantData.id, product.id, `Cliente${i + 1} Prueba`, `cliente${i + 1}@test.com`);
      }
      console.log(`  ✅ Pedidos de prueba creados`);
    }
  }

  // ============================================
  // RESUMEN FINAL
  // ============================================
  console.log('\n===========================================');
  console.log('✅ SEED COMPLETADO EXITOSAMENTE');
  console.log('===========================================');
  console.log('\n📋 CREDENCIALES DE PRUEBA:\n');

  console.log('👑 SUPERADMIN:');
  console.log(`   Email:    superadmin@saas.com`);
  console.log(`   Password: ${superAdminPassword}`);
  console.log(`   Rol:      superadmin`);
  console.log('');

  // Agrupar por tenant
  const byTenant: Record<string, typeof createdUsers> = {};
  for (const user of createdUsers) {
    if (user.tenant !== 'system') {
      if (!byTenant[user.tenant]) byTenant[user.tenant] = [];
      byTenant[user.tenant].push(user);
    }
  }

  for (const [tenantId, users] of Object.entries(byTenant)) {
    console.log(`🏢 ${tenantId.toUpperCase()}:`);
    for (const user of users) {
      console.log(`   ${user.role === 'admin' ? '👤 Admin:' : '   Staff:'} ${user.email} / ${user.password}`);
    }
    console.log('');
  }

  console.log('===========================================');
  console.log('📝 NOTAS:');
  console.log('   - Todos los usuarios usan la contraseña: Admin123!');
  console.log(`   - El superadmin usa: ${superAdminPassword}`);
  console.log('   - Los usuarios pueden hacer login desde la app móvil');
  console.log('   - Datos creados para testing, se pueden limpiar después');
  console.log('===========================================');
}

main().catch(error => {
  console.error('\n❌ Error en el seed:', error.message);
  process.exit(1);
});
