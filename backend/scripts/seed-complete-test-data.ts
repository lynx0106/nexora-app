/**
 * Script para crear datos de prueba completos para testing de App Móvil Nexora
 * Crea 3 empresas con usuarios, productos, pedidos, citas y conversaciones de chat
 * Uso: npx ts-node scripts/seed-complete-test-data.ts
 */

import axios from 'axios';

const API_URL = 'https://nexora-app-production-3199.up.railway.app';

const API = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Credenciales especificadas
const ADMIN_PASSWORD = 'Admin123!';
const EMPLEADO_PASSWORD = 'Empleado123!';
const CLIENTE_PASSWORD = 'Cliente123!';

// Admin credentials que ya existen
const ADMINS = [
  { email: 'admin@sabor.com', password: ADMIN_PASSWORD, tenantSlug: 'restaurante-el-sabor' },
  { email: 'admin@sonrisa.com', password: ADMIN_PASSWORD, tenantSlug: 'clinica-sonrisa' },
  { email: 'admin@estilo.com', password: ADMIN_PASSWORD, tenantSlug: 'barberia-estilo' },
];

// Datos a crear (ya con los tenant IDs correctos)
const TENANTS_CONFIG = [
  {
    id: 'restaurante-el-sabor',
    slug: 'restaurante-el-sabor',
    name: 'El Sabor Latino',
    adminEmail: 'admin@sabor.com',
    users: [
      { email: 'mesero1@sabor.com', firstName: 'Carlos', lastName: 'Rodríguez', role: 'staff', password: EMPLEADO_PASSWORD },
      { email: 'cocina@sabor.com', firstName: 'María', lastName: 'García', role: 'staff', password: EMPLEADO_PASSWORD },
      { email: 'cliente1@sabor.com', firstName: 'Juan', lastName: 'Pérez', role: 'user', password: CLIENTE_PASSWORD },
      { email: 'cliente2@sabor.com', firstName: 'Ana', lastName: 'López', role: 'user', password: CLIENTE_PASSWORD },
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
    ],
    useAppointments: false,
    useOrders: true,
    numOrders: 5,
  },
  {
    id: 'clinica-sonrisa',
    slug: 'clinica-sonrisa',
    name: 'Sonrisa Perfecta',
    adminEmail: 'admin@sonrisa.com',
    users: [
      { email: 'dentista@sonrisa.com', firstName: 'Dr. Fernando', lastName: 'Gómez', role: 'staff', password: EMPLEADO_PASSWORD },
      { email: 'recepcion@sonrisa.com', firstName: 'Ana', lastName: 'Recepción', role: 'staff', password: EMPLEADO_PASSWORD },
      { email: 'paciente1@sonrisa.com', firstName: 'Pedro', lastName: 'Martínez', role: 'user', password: CLIENTE_PASSWORD },
      { email: 'paciente2@sonrisa.com', firstName: 'Laura', lastName: 'Fernández', role: 'user', password: CLIENTE_PASSWORD },
    ],
    services: [
      { name: 'Limpieza Dental Profunda', description: 'Eliminación de placa y sarro, pulido dental', price: 80000, duration: 60 },
      { name: 'Blanqueamiento Dental', description: 'Blanqueamiento profesional con lámpara LED', price: 350000, duration: 90 },
      { name: 'Ortodoncia Brackets', description: 'Instalación de brackets metálicos', price: 2800000, duration: 120 },
      { name: 'Implante Dental', description: 'Implante de titanio con corona', price: 2500000, duration: 180 },
      { name: 'Endodoncia', description: 'Tratamiento de conducto', price: 450000, duration: 90 },
      { name: 'Extracción Simple', description: 'Extracción de pieza dental', price: 120000, duration: 45 },
    ],
    useAppointments: true,
    useOrders: false,
    numAppointments: 5,
  },
  {
    id: 'barberia-estilo',
    slug: 'barberia-estilo',
    name: 'Estilo Urbano',
    adminEmail: 'admin@estilo.com',
    users: [
      { email: 'barbero1@estilo.com', firstName: 'Luis', lastName: 'Barbero', role: 'staff', password: EMPLEADO_PASSWORD },
      { email: 'barbero2@estilo.com', firstName: 'Andrés', lastName: 'Estilista', role: 'staff', password: EMPLEADO_PASSWORD },
      { email: 'cliente1@estilo.com', firstName: 'Miguel', lastName: 'Torres', role: 'user', password: CLIENTE_PASSWORD },
      { email: 'cliente2@estilo.com', firstName: 'Sofia', lastName: 'Ruiz', role: 'user', password: CLIENTE_PASSWORD },
    ],
    services: [
      { name: 'Corte Clásico', description: 'Corte de cabello tradicional con tijera', price: 25000, duration: 45 },
      { name: 'Corte Moderno', description: 'Corte con diseño y degradado', price: 30000, duration: 60 },
      { name: 'Afeitado Tradicional', description: 'Afeitado con navaja y toalla caliente', price: 20000, duration: 30 },
      { name: 'Arreglo de Barba', description: 'Perfilado y cuidado de barba', price: 18000, duration: 30 },
      { name: 'Corte + Barba', description: 'Combo corte de cabello y arreglo de barba', price: 40000, duration: 75 },
    ],
    products: [
      { name: 'Shampoo Premium', description: 'Shampoo para cabello hombre', price: 35000, stock: 50 },
      { name: 'Cera para Cabello', description: 'Cera fijadora mate', price: 28000, stock: 80 },
      { name: 'Bálsamo After Shave', description: 'Bálsamo calmante', price: 22000, stock: 40 },
    ],
    useAppointments: true,
    useOrders: true,
    numAppointments: 4,
    numOrders: 3,
  },
];

let currentToken = '';
let currentTenantId = '';
let currentUserId = '';

async function login(email: string, password: string) {
  try {
    const res = await API.post('/auth/login', { email, password });
    currentToken = res.data.accessToken;
    currentTenantId = res.data.user?.tenantId || '';
    currentUserId = res.data.user?.id || res.data.user?.userId || '';
    API.defaults.headers.common['Authorization'] = `Bearer ${currentToken}`;
    console.log(`✅ Login exitoso: ${email} (tenant: ${currentTenantId})`);
    return true;
  } catch (error: any) {
    console.log(`❌ Error login ${email}:`, error.response?.data?.message || error.message);
    return false;
  }
}

async function createUser(user: { email: string; firstName: string; lastName: string; role: string; password: string }) {
  try {
    const res = await API.post('/users', {
      email: user.email,
      password: user.password,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
    console.log(`  ✅ Usuario creado: ${user.email} (${user.role})`);
    return res.data;
  } catch (error: any) {
    if (error.response?.status === 409) {
      console.log(`  ℹ️ Usuario ya existe: ${user.email}`);
      return null;
    }
    console.log(`  ❌ Error creando usuario ${user.email}:`, error.response?.data?.message || error.message);
    return null;
  }
}

async function createProduct(product: { name: string; description: string; price: number; stock?: number; duration?: number }) {
  try {
    const res = await API.post('/products', {
      name: product.name,
      description: product.description,
      price: product.price,
      stock: product.stock || 0,
      duration: product.duration,
    });
    console.log(`  ✅ Producto/Servicio creado: ${product.name}`);
    return res.data;
  } catch (error: any) {
    console.log(`  ❌ Error creando producto ${product.name}:`, error.response?.data?.message || error.message);
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

async function createChatMessage(tenantId: string, senderEmail: string, targetUserEmail: string, content: string) {
  try {
    await API.post('/chat/message', {
      tenantId,
      scope: 'CUSTOMER',
      targetUserId: targetUserEmail,
      content,
    });
    return true;
  } catch (error: any) {
    return false;
  }
}

async function main() {
  console.log('===========================================');
  console.log('🚀 NEXORA - SEED COMPLETO DE DATOS DE PRUEBA');
  console.log('===========================================');
  console.log(`📡 Conectando a: ${API_URL}`);
  console.log('');

  const createdData: any = { tenants: [] };

  // Procesar cada tenant
  for (const tenant of TENANTS_CONFIG) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🏢 PROCESANDO: ${tenant.name}`);
    console.log('='.repeat(50));

    // Login como admin del tenant
    console.log(`\n🔐 Haciendo login como admin...`);
    const loggedIn = await login(tenant.adminEmail, ADMIN_PASSWORD);
    if (!loggedIn) {
      console.log(`❌ No se pudo login como admin, saltando tenant...`);
      continue;
    }

    const tenantData: any = { ...tenant, createdUsers: [], createdProducts: [], createdOrders: [], createdAppointments: [] };
    createdData.tenants.push(tenantData);

    // 1. Crear usuarios staff y clientes
    console.log(`\n👥 Creando usuarios...`);
    for (const user of tenant.users) {
      await createUser(user);
      tenantData.createdUsers.push({
        email: user.email,
        password: user.password,
        role: user.role,
      });
    }

    // 2. Crear productos/servicios
    console.log(`\n📦 Creando productos/servicios...`);
    
    if (tenant.products) {
      for (const product of tenant.products) {
        const created = await createProduct(product);
        if (created) {
          tenantData.createdProducts.push({ ...product, id: created.id, isService: false });
        }
      }
    }

    if (tenant.services) {
      for (const service of tenant.services) {
        const created = await createProduct(service);
        if (created) {
          tenantData.createdProducts.push({ ...service, id: created.id, isService: true });
        }
      }
    }
    console.log(`  ✅ ${tenantData.createdProducts.length} productos/servicios creados`);

    // 3. Crear pedidos
    if (tenant.useOrders && tenantData.createdProducts.length > 0) {
      console.log(`\n🛒 Creando pedidos...`);
      const productsOnly = tenantData.createdProducts.filter((p: any) => !p.isService);
      
      for (let i = 0; i < (tenant.numOrders || 0); i++) {
        const product = productsOnly[i % productsOnly.length];
        if (product) {
          const client = tenant.users[2 + (i % 2)]; // clientes
          const order = await createOrder(currentTenantId, product.id, `${client.firstName} ${client.lastName}`, client.email);
          if (order) {
            tenantData.createdOrders.push(order);
          }
        }
      }
      console.log(`  ✅ ${tenantData.createdOrders.length} pedidos creados`);
    }

    // 4. Crear citas
    if (tenant.useAppointments && tenantData.createdProducts.length > 0) {
      console.log(`\n📅 Creando citas...`);
      const servicesOnly = tenantData.createdProducts.filter((p: any) => p.isService);
      
      for (let i = 0; i < (tenant.numAppointments || 0); i++) {
        const service = servicesOnly[i % servicesOnly.length];
        if (service) {
          const client = tenant.users[2 + (i % 2)];
          
          const appointmentDate = new Date();
          appointmentDate.setDate(appointmentDate.getDate() + 1 + Math.floor(i / 2));
          appointmentDate.setHours(9 + (i % 8), 0, 0, 0);

          const appointment = await createAppointment(
            currentTenantId,
            service.id,
            `${client.firstName} ${client.lastName}`,
            client.email,
            appointmentDate
          );
          if (appointment) {
            tenantData.createdAppointments.push(appointment);
          }
        }
      }
      console.log(`  ✅ ${tenantData.createdAppointments.length} citas creadas`);
    }

    // 5. Crear conversaciones de chat
    console.log(`\n💬 Creando conversaciones de chat...`);
    const numChats = tenant.useAppointments ? (tenant.numAppointments || 4) : 3;
    for (let i = 0; i < Math.min(numChats, tenant.users.length - 2); i++) {
      const client = tenant.users[2 + (i % 2)];
      const staff = tenant.users[0];
      
      await createChatMessage(tenant.id, client.email, staff.email, `Hola, me gustaría hacer una consulta sobre ${tenant.name}`);
      await createChatMessage(tenant.id, staff.email, client.email, `Por supuesto, ¿en qué puedo ayudarle?`);
      await createChatMessage(tenant.id, client.email, staff.email, `Quisiera más información sobre sus servicios`);
    }
    console.log(`  ✅ Conversaciones de chat creadas`);
  }

  // ============================================
  // RESUMEN FINAL
  // ============================================
  console.log('\n\n');
  console.log('===========================================');
  console.log('✅ SEED COMPLETADO EXITOSAMENTE');
  console.log('===========================================');

  // Mostrar credenciales
  console.log('\n📋 CREDENCIALES DE PRUEBA:\n');

  console.log('👑 SUPERADMIN:');
  console.log('   Email:    superadmin@saas.com');
  console.log('   Password: SuperAdmin2024!');
  console.log('');

  for (const tenant of createdData.tenants) {
    console.log(`🏢 ${tenant.name.toUpperCase()} (${tenant.slug})`);
    console.log(`   Admin: admin@${tenant.slug.split('-')[0]}.com / ${ADMIN_PASSWORD}`);
    
    for (const user of tenant.createdUsers) {
      const roleLabel = user.role === 'staff' ? 'Staff' : 'Cliente';
      console.log(`   ${roleLabel}: ${user.email} / ${user.password}`);
    }
    console.log('');
  }

  // Resumen de datos
  console.log('===========================================');
  console.log('📊 RESUMEN DE DATOS CREADOS:');
  console.log('===========================================');
  
  let totalUsers = 0;
  let totalProducts = 0;
  let totalOrders = 0;
  let totalAppointments = 0;

  for (const tenant of createdData.tenants) {
    console.log(`\n📁 ${tenant.name}:`);
    console.log(`   - Usuarios: ${tenant.createdUsers.length}`);
    console.log(`   - Productos/Servicios: ${tenant.createdProducts.length}`);
    console.log(`   - Pedidos: ${tenant.createdOrders.length}`);
    console.log(`   - Citas: ${tenant.createdAppointments.length}`);
    
    totalUsers += tenant.createdUsers.length;
    totalProducts += tenant.createdProducts.length;
    totalOrders += tenant.createdOrders.length;
    totalAppointments += tenant.createdAppointments.length;
  }

  console.log(`\n📈 TOTALES:`);
  console.log(`   - Usuarios: ${totalUsers + 3} (incluye admins)`);
  console.log(`   - Productos/Servicios: ${totalProducts}`);
  console.log(`   - Pedidos: ${totalOrders}`);
  console.log(`   - Citas: ${totalAppointments}`);
  console.log(`   - Chats: Conversaciones creadas`);

  console.log('\n===========================================');
}

main().catch(error => {
  console.error('\n❌ Error en el seed:', error.message);
  process.exit(1);
});
