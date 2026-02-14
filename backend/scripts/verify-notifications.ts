import { io } from 'socket.io-client';
import fetch from 'node-fetch';

const API_URL = 'http://localhost:4001'; // Ensure this matches your running backend port

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('🚀 Starting Notifications Flow Verification...');

  // 1. Register a new Tenant (Business)
  const tenantName = `NotifyTest-${Date.now()}`;
  const tenantEmail = `notify-${Date.now()}@test.com`;
  const password = 'Password123!';

  console.log(`1. Registering Tenant: ${tenantName}`);
  const registerRes = await fetch(`${API_URL}/tenants/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessName: tenantName,
      email: tenantEmail,
      password: password,
      country: 'Colombia',
    }),
  });

  if (!registerRes.ok) {
    const err = await registerRes.text();
    throw new Error(`Registration failed: ${err}`);
  }

  const registerData: any = await registerRes.json();
  // console.log('DEBUG: registerData:', JSON.stringify(registerData, null, 2));
  const { tenant, admin } = registerData;
  console.log(`   ✅ Tenant registered. ID: ${tenant.id}, Admin ID: ${admin.id}`);

  // 1b. Login to get Token
  console.log('1b. Logging in...');
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: tenantEmail,
      password: password,
      tenantId: tenant.id // Optional depending on login logic, but usually email/password is enough if email unique per tenant?
      // Actually our login might require tenantId if email is not unique globally, but for this test it is unique.
      // Let's see auth.service.ts if needed.
    }),
  });

  if (!loginRes.ok) {
    throw new Error(`Login failed: ${await loginRes.text()}`);
  }

  const loginData: any = await loginRes.json();
  if (!loginData.accessToken) {
      console.error('Login Response:', loginData);
      throw new Error('No accessToken received');
  }
  const token = loginData.accessToken;
  console.log('   ✅ Logged in. Token received:', token.substring(0, 20) + '...');

  // 2. Connect to Notifications Socket
  console.log('2. Connecting to Notifications Socket...');
  const socket = io(`${API_URL}/notifications`, {
    auth: { token },
    transports: ['websocket'],
  });

  const notificationPromise = new Promise((resolve, reject) => {
    socket.on('connect', () => {
      console.log('   ✅ Connected to Socket!');
    });

    socket.on('connect_error', (err) => {
      console.error('   ❌ Connection Error:', err.message);
    });

    socket.on('notification', (data) => {
      console.log('   📩 RECEIVED NOTIFICATION:', data);
      resolve(data);
    });

    // Timeout if not received
    setTimeout(() => {
      // Don't reject yet, maybe we check API
      console.log('   ⚠️ Timeout waiting for socket event (might verify via API)');
      resolve(null); 
    }, 10000);
  });

  // 3. Create a Product
  console.log('3. Creating a Product...');
  const productRes = await fetch(`${API_URL}/products`, {
    method: 'POST',
    headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' 
    },
    body: JSON.stringify({
      name: 'Producto Test Notif',
      price: 10000,
      description: 'Test Description',
      stock: 10,
      category: 'Test',
      imageUrl: 'http://test.com/image.jpg',
      tenantId: tenant.id
    }),
  });

  if (!productRes.ok) {
      throw new Error(`Failed to create product: ${await productRes.text()}`);
  }

  const product: any = await productRes.json();
  console.log(`   ✅ Product created: ${product.id}`);

  // 4. Create an Order (Should trigger notification)
  console.log('4. Creating an Order (Triggers Notification)...');
  // Use correct endpoint: /public/order/:tenantId
  const orderRes = await fetch(`${API_URL}/public/order/${tenant.id}`, { 
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [
        { productId: product.id, quantity: 1, price: 10000 }
      ],
      client: {
        firstName: 'Cliente',
        lastName: 'Prueba',
        email: 'cliente@test.com',
        address: 'Calle 123',
        city: 'Bogota',
        phone: '3001234567'
      }
    }),
  });

  if (!orderRes.ok) {
    console.error('Order creation failed:', await orderRes.text());
  } else {
    const order = await orderRes.json();
    console.log(`   ✅ Order created: ${order.id}`);
  }

  // 5. Verify Notification Received via Socket
  console.log('5. Waiting for Socket Notification...');
  const receivedNotification: any = await notificationPromise;

  if (receivedNotification) {
    console.log('   ✅ Notification Verified via WebSocket!');
    if (receivedNotification.title === 'Nuevo Pedido') {
      console.log('      - Title Correct');
    } else {
      console.warn('      - Title Mismatch:', receivedNotification.title);
    }
  } else {
    console.warn('   ⚠️ Notification NOT received via Socket. Checking API...');
  }

  // 6. Verify Notification via API
  console.log('6. Checking Unread Notifications API...');
  await sleep(2000); // Give DB time
  const apiRes = await fetch(`${API_URL}/notifications/unread`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!apiRes.ok) {
    throw new Error(`Failed to fetch notifications: ${await apiRes.text()}`);
  }

  const notifications: any = await apiRes.json();
  
  if (!Array.isArray(notifications)) {
      console.error('API Response:', notifications);
      throw new Error('Notifications response is not an array');
  }
  
  const orderNotification = notifications.find((n: any) => n.title === 'Nuevo Pedido');
  
  if (orderNotification) {
    console.log('   ✅ Notification found in API List!');
    console.log(`      - ID: ${orderNotification.id}`);
    console.log(`      - Msg: ${orderNotification.message}`);
    
    // 7. Mark as Read
    console.log('7. Marking as Read...');
    await fetch(`${API_URL}/notifications/${orderNotification.id}/read`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    // Verify it's gone from unread
    const apiRes2 = await fetch(`${API_URL}/notifications/unread`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const notifications2: any = await apiRes2.json();
    if (notifications2.find((n: any) => n.id === orderNotification.id)) {
      console.error('   ❌ Notification still unread!');
    } else {
      console.log('   ✅ Notification marked as read successfully.');
    }

  } else {
    console.error('   ❌ Notification NOT found in API List.');
  }

  socket.disconnect();
  console.log('Done.');
}

main().catch(console.error);
