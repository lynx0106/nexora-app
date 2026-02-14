
import axios from 'axios';

const API_URL = 'http://localhost:4001';
const SUPERADMIN_EMAIL = 'superadmin@saas.com';
const SUPERADMIN_PASSWORD = 'SuperAdmin123!'; // Correct from users.service.ts

// Data for Simulation
const SCENARIOS = [
  {
    id: 'pizzeria-napoli', // Existing Tenant ID
    name: 'Pizzería Napoli',
    sector: 'restaurante',
    admin: { email: 'admin.sim@napoli.com', name: 'Luigi Manager' }, // Changed email to avoid conflicts
    staff: { email: 'chef.sim@napoli.com', name: 'Mario Chef' },
    client: { email: 'client.sim@napoli.com', name: 'Giuseppe Cliente' },
    messages: [
      { from: 'admin', to: 'staff', scope: 'INTERNAL', content: 'Mario, ¿cuánta masa nos queda?' },
      { from: 'staff', to: 'admin', scope: 'INTERNAL', content: 'Suficiente para 20 pizzas, Luigi.' },
      { from: 'client', to: 'business', scope: 'CUSTOMER', content: 'Hola, ¿tienen pizza de pepperoni?' },
      { from: 'admin', to: 'client', scope: 'CUSTOMER', content: '¡Sí! Es nuestra especialidad.' },
      { from: 'admin', to: 'superadmin', scope: 'SUPPORT', content: 'Necesito ayuda para configurar el menú.' },
    ]
  },
  {
    id: 'tienda-moda-urbana', // Existing Tenant ID
    name: 'Moda Urbana Store',
    sector: 'retail',
    admin: { email: 'admin.sim@modaurbana.com', name: 'Ana Fashion' },
    staff: { email: 'sales.sim@modaurbana.com', name: 'Pedro Ventas' },
    client: { email: 'client.sim@modaurbana.com', name: 'Maria Compradora' },
    messages: [
      { from: 'admin', to: 'staff', scope: 'INTERNAL', content: 'Pedro, llegaron las nuevas camisetas?' },
      { from: 'staff', to: 'admin', scope: 'INTERNAL', content: 'Sí, ya están en el inventario.' },
      { from: 'client', to: 'business', scope: 'CUSTOMER', content: '¿Hacen envíos a domicilio?' },
      { from: 'admin', to: 'client', scope: 'CUSTOMER', content: 'Claro, envíos gratis por compras mayores a $50.' },
      { from: 'admin', to: 'superadmin', scope: 'SUPPORT', content: 'El reporte de ventas no carga.' },
    ]
  },
  {
    id: 'salon-belleza-glam', // Existing Tenant ID
    name: 'Glamour Beauty Salon',
    sector: 'service', // or 'belleza' if mapped
    admin: { email: 'admin.sim@glamour.com', name: 'Sofia Estilista' },
    staff: { email: 'recep.sim@glamour.com', name: 'Clara Recepción' },
    client: { email: 'client.sim@glamour.com', name: 'Laura Cliente' },
    messages: [
      { from: 'admin', to: 'staff', scope: 'INTERNAL', content: 'Clara, confirma la cita de las 3pm.' },
      { from: 'staff', to: 'admin', scope: 'INTERNAL', content: 'Confirmada, Sra. Gomez viene a tinte.' },
      { from: 'client', to: 'business', scope: 'CUSTOMER', content: 'Hola, quisiera agendar un corte.' },
      { from: 'admin', to: 'client', scope: 'CUSTOMER', content: 'Hola Laura, ¿qué día prefieres?' },
      { from: 'admin', to: 'superadmin', scope: 'SUPPORT', content: '¿Cómo cambio mi horario de atención?' },
    ]
  }
];

async function login(email, password) {
  try {
    const res = await axios.post(`${API_URL}/auth/login`, { email, password });
    return res.data.accessToken;
  } catch (err) {
    console.error(`Login failed for ${email}:`, err.response?.data?.message || err.message);
    return null;
  }
}

async function createTenant(token, data) {
  try {
    // Try to create tenant via POST /tenants/register or POST /tenants
    // Assuming /tenants creates a tenant directly (if superadmin)
    // Or we use the registration flow.
    // Let's try direct creation if endpoint exists, otherwise use register-with-admin
    
    // Based on codebase, usually we have a way to create tenant.
    // If I use `POST /tenants`, I need to see if it accepts ID.
    // If not, I'll use `POST /auth/register` which creates tenant + admin?
    
    // Let's assume there is a way to seed or create.
    // I'll try `POST /tenants` with superadmin token.
    
    // Check if tenant exists first?
    // We'll skip check and try create.
    
    const payload = {
      name: data.name,
      sector: data.sector,
      tenantId: data.id, // Explicit ID
      // Admin details for creation
      adminFirstName: data.admin.name.split(' ')[0],
      adminLastName: data.admin.name.split(' ')[1] || 'Admin',
      adminEmail: data.admin.email,
      adminPassword: 'password123'
    };
    
    // Usually the endpoint is /auth/register for new tenants, 
    // BUT superadmin might have a direct endpoint.
    // Let's try /tenants endpoint.
    await axios.post(`${API_URL}/tenants`, payload, {
        headers: { Authorization: `Bearer ${token}` }
    });
    console.log(`Created/Ensured Tenant: ${data.name}`);
    return data.id;
  } catch (err) {
    // If conflict, maybe it exists.
    if (err.response?.status === 409 || err.response?.data?.message?.includes('exist')) {
        console.log(`Tenant ${data.name} already exists.`);
        return data.id;
    }
    console.error(`Failed to create tenant ${data.name}:`, err.response?.data || err.message);
    return null;
  }
}

async function ensureUser(token, tenantId, email, name, role) {
    try {
        const parts = name.split(' ');
        const firstName = parts[0];
        const lastName = parts.slice(1).join(' ') || 'User';

        // Create user
        const res = await axios.post(`${API_URL}/users`, {
            email,
            password: 'password123',
            firstName,
            lastName,
            role,
            tenantId,
            phone: '555-1234', // Dummy phone
            address: 'Main St 123' // Dummy address
        }, { headers: { Authorization: `Bearer ${token}` } });
        console.log(`Created User: ${email} (${role})`);
        return res.data.id;
    } catch (err) {
        // If user exists, try to login to get ID
        if (err.response?.status === 409 || err.response?.data?.message?.includes('uso')) {
             console.log(`User ${email} exists, retrieving ID...`);
             const userToken = await login(email, 'password123');
             if(userToken) {
                 const profile = await axios.get(`${API_URL}/users/profile`, {
                     headers: { Authorization: `Bearer ${userToken}` }
                 });
                 return profile.data.id;
             }
        }
        console.error(`Failed to create user ${email}:`, err.response?.data || err.message);
        return null;
    }
}

async function sendMessage(senderEmail, tenantId, content, scope, targetUserId) {
    const token = await login(senderEmail, 'password123');
    if (!token) return;

    try {
        await axios.post(`${API_URL}/chat/message`, {
            tenantId,
            content,
            scope,
            targetUserId,
            type: 'text'
        }, { headers: { Authorization: `Bearer ${token}` } });
        console.log(`Message sent from ${senderEmail} [${scope}]`);
    } catch (err) {
        console.error(`Failed to send message from ${senderEmail}:`, err.response?.data || err.message);
    }
}

async function main() {
  console.log('--- Starting Realistic Chat Simulation ---');
  
  // 0. Seed Superadmin (Ensure it exists)
   try {
       await axios.post(`${API_URL}/users/seed-superadmin`);
       console.log('Superadmin seeded/verified.');
   } catch (e) {
      console.log('Seed warning:', e.message);
  }

  // 1. Login Superadmin
  const superToken = await login(SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD);
  if (!superToken) return;

  for (const scenario of SCENARIOS) {
    console.log(`\nProcessing: ${scenario.name}...`);
    
    // 2. Create Tenant
    const tenantId = await createTenant(superToken, scenario);
    if (!tenantId) continue;

    // 3. Create Users
    let adminId;
    const adminToken = await login(scenario.admin.email, 'password123');
    if (adminToken) {
         const p = await axios.get(`${API_URL}/users/profile`, { headers: { Authorization: `Bearer ${adminToken}` } });
         adminId = p.data.id;
         console.log(`Admin confirmed: ${scenario.admin.email}`);
    } else {
        // Create admin if not exists (fallback)
        adminId = await ensureUser(superToken, tenantId, scenario.admin.email, scenario.admin.name, 'admin');
        // Retry login
        const newAdminToken = await login(scenario.admin.email, 'password123');
        if (!newAdminToken) {
             console.log(`Failed to login as admin ${scenario.admin.email} even after ensuring user.`);
        }
    }

    // Determine staff role based on sector
    let staffRole = 'support';
    if (scenario.sector === 'service' || scenario.sector === 'belleza') staffRole = 'doctor';

    const staffId = await ensureUser(superToken, tenantId, scenario.staff.email, scenario.staff.name, staffRole);
    
    const clientId = await ensureUser(superToken, tenantId, scenario.client.email, scenario.client.name, 'user');

    // 4. Send Messages
    for (const msg of scenario.messages) {
        let senderEmail = '';
        let targetUserId = undefined;

        if (msg.from === 'admin') senderEmail = scenario.admin.email;
        if (msg.from === 'staff') senderEmail = scenario.staff.email;
        if (msg.from === 'client') senderEmail = scenario.client.email;

        // Determine target
        if (msg.scope === 'CUSTOMER') {
            // If from client, target is business (no targetUserId needed usually, or admin?)
            // If from admin, target is client.
            if (msg.from === 'admin') targetUserId = clientId;
            // If from client, target is null (broadcast to business) or specific?
            // Usually client sends to business.
        }
        
        // Wait, for CUSTOMER scope:
        // Client -> Business: targetUserId is null? Or maybe the system handles it.
        // Business -> Client: targetUserId is ClientID.
        
        if (msg.from === 'client') {
            // Client sending to business
            // targetUserId = undefined;
        } else if (msg.to === 'client') {
            targetUserId = clientId;
        }

        await sendMessage(senderEmail, tenantId, msg.content, msg.scope, targetUserId);
    }
  }
  
  console.log('\n--- Simulation Complete ---');
}

main();
