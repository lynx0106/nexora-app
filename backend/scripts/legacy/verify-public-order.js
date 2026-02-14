
const API_URL = 'http://localhost:4001';

console.log('--- VERSION 2 ---');

async function runTest() {
  try {
    console.log('--- STARTING PUBLIC ORDER FLOW VERIFICATION ---');

    // --- CREDENTIALS ---
    const SUPER_ADMIN = { email: 'superadmin@saas.com', password: 'SuperAdmin123!' };
    const TENANT_ID = `tenant-public-${Date.now()}`;
    const PUBLIC_CLIENT = {
        firstName: 'Public',
        lastName: 'Client',
        email: `client.${Date.now()}@public.com`,
        phone: '1234567890',
        address: '123 Public St',
        city: 'Internet City'
    };

    // 0. SEED USERS (Ensure they exist)
    console.log('\n0. Seeding Users...');
    try {
        await fetch(`${API_URL}/users/seed-superadmin`, { method: 'POST' });
    } catch (e) {}

    // 0. Ping Check
    console.log('0. Checking Public API health...');
    try {
        const pingRes = await fetch(`${API_URL}/public/ping`);
        const pingText = await pingRes.text();
        console.log('Ping response:', pingText);
        if (pingText !== 'pong') {
             throw new Error('Public API is not healthy');
        }
    } catch (err) {
        console.error('Ping failed:', err.message);
        // Continue anyway to see other errors
    }

    // 1. Login SuperAdmin
    console.log('\n1. Logging in SuperAdmin...');
    const tokenSuper = await login(SUPER_ADMIN);
    console.log(`SuperAdmin logged in.`);

    // 2. Create Tenant (implicitly via Product creation or ensure it exists)
    // We'll create a product which usually requires a tenant.
    console.log('\n2. Creating Public Product...');
    const product = await createProduct(tokenSuper, TENANT_ID, 'Public Product', 50);
    console.log(`Product created: ${product.id}`);

    // 3. Place Public Order (NO AUTH)
    console.log('\n3. Placing Public Order (No Auth)...');
    const orderResponse = await fetch(`${API_URL}/public/order/${TENANT_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            items: [{ 
                productId: product.id, 
                quantity: 2, 
                price: 100 
            }],
            client: PUBLIC_CLIENT
        })
    });

    if (!orderResponse.ok) {
        throw new Error(`Public Order failed: ${await orderResponse.text()}`);
    }
    const publicOrder = await orderResponse.json();
    console.log(`Public Order Created: ${publicOrder.id}`);

    // 4. Verify Order as Admin
    console.log('\n4. Verifying Order in Admin Panel...');
    const ordersRes = await fetch(`${API_URL}/orders/tenant/${TENANT_ID}`, {
        headers: { 'Authorization': `Bearer ${tokenSuper}` }
    });
    const orders = await ordersRes.json();
    const foundOrder = orders.find(o => o.id === publicOrder.id);
    
    if (!foundOrder) throw new Error('Order not found in Admin Panel!');
    console.log('Order verified in Admin Panel.');
    
    if (foundOrder.shippingAddress?.street !== PUBLIC_CLIENT.address) {
        throw new Error('Shipping Address mismatch!');
    }
    console.log('Shipping Address verified.');

    // 5. Verify User Creation
    console.log('\n5. Verifying Client User Creation...');
    // We can check if the order has a userId, and if we can fetch that user
    if (!foundOrder.userId) throw new Error('Order is not linked to any user!');
    
    const userRes = await fetch(`${API_URL}/users/${foundOrder.userId}`, {
        headers: { 'Authorization': `Bearer ${tokenSuper}` }
    });
    
    if (!userRes.ok) throw new Error('Could not fetch created client user');
    const user = await userRes.json();
    
    if (user.email !== PUBLIC_CLIENT.email) throw new Error('Client email mismatch!');
    console.log(`Client User verified: ${user.email} (ID: ${user.id})`);

    // 6. Create Public Service (Product with duration)
    console.log('\n6. Creating Public Service...');
    const service = await createService(tokenSuper, TENANT_ID, 'Public Service', 60);
    console.log(`Service created: ${service.id}`);

    // 6.5 Verify Public Availability
    console.log('\n6.5 Verifying Public Availability...');
    // Fetch tenant info first to check settings
    const tenantInfoRes = await fetch(`${API_URL}/public/tenant/${TENANT_ID}`);
    if (tenantInfoRes.ok) {
        const tenantInfo = await tenantInfoRes.json();
        console.log('    Tenant Opening Time:', tenantInfo.openingTime);
        console.log('    Tenant Closing Time:', tenantInfo.closingTime);
    } else {
        console.warn('    WARNING: Failed to fetch tenant info for availability check.');
    }

    const checkDate = new Date();
    checkDate.setDate(checkDate.getDate() + 1);
    const dateStr = checkDate.toISOString().split('T')[0];
    const availRes = await fetch(`${API_URL}/public/availability/${TENANT_ID}?date=${dateStr}`);
    const slots = await availRes.json();
    console.log(`    Available Slots for ${dateStr}: ${slots.length}`);
    if (slots.length === 0) console.warn('    WARNING: No slots found! Check tenant settings.');
    else console.log('    First slot:', slots[0]);

    // 7. Book Public Appointment (No Auth)
    console.log('\n7. Booking Public Appointment (No Auth)...');
    const appointmentDate = new Date();
    appointmentDate.setDate(appointmentDate.getDate() + 1);
    appointmentDate.setHours(10, 0, 0, 0);

    const bookResponse = await fetch(`${API_URL}/public/book/${TENANT_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            serviceId: service.id,
            dateTime: appointmentDate.toISOString(),
            client: PUBLIC_CLIENT
        })
    });

    if (!bookResponse.ok) {
        throw new Error(`Public Booking failed: ${await bookResponse.text()}`);
    }
    const publicAppointment = await bookResponse.json();
    console.log(`Public Appointment Created: ${publicAppointment.id}`);

    // 8. Verify Client History (Orders & Appointments)
    console.log('\n8. Verifying Client History...');
    const historyOrdersRes = await fetch(`${API_URL}/orders/tenant/${TENANT_ID}?userId=${user.id}`, {
        headers: { 'Authorization': `Bearer ${tokenSuper}` }
    });
    const historyOrders = await historyOrdersRes.json();
    console.log(`    Client Orders Found: ${historyOrders.length}`);
    if (historyOrders.length === 0) throw new Error('Client History: Order not found!');

    const historyApptsRes = await fetch(`${API_URL}/appointments/tenant/${TENANT_ID}?userId=${user.id}`, {
        headers: { 'Authorization': `Bearer ${tokenSuper}` }
    });
    const historyAppts = await historyApptsRes.json();
    console.log(`    Client Appointments Found: ${historyAppts.length}`);
    if (historyAppts.length === 0) throw new Error('Client History: Appointment not found!');

    console.log('\n--- SUCCESS: Public Order & Appointment Flows Verified! ---');

  } catch (error) {
    console.error('\n!!! TEST FAILED !!!');
    console.error(error);
    process.exit(1);
  }
}

// --- HELPERS ---

async function login(user) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: user.password })
  });
  if (!res.ok) throw new Error(`Login failed: ${await res.text()}`);
  return (await res.json()).accessToken;
}

async function createProduct(token, tenantId, name, stock) {
  const res = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: `${name}-${Date.now()}`,
      description: 'Test Public Product',
      price: 100,
      stock,
      tenantId
    })
  });
  if (!res.ok) throw new Error(`Create Product failed: ${await res.text()}`);
  return res.json();
}

async function createService(token, tenantId, name, duration) {
  const res = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      name: `${name}-${Date.now()}`,
      description: 'Test Public Service',
      price: 50,
      stock: 999,
      duration, // Service duration in minutes
      tenantId
    })
  });
  if (!res.ok) throw new Error(`Create Service failed: ${await res.text()}`);
  return res.json();
}

runTest();
