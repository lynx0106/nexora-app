const io = require('socket.io-client');

// Configuration
const API_URL = 'http://localhost:4001';
const EMAIL = `test.admin.${Date.now()}@example.com`;
const PASSWORD = 'Password123!';
const TENANT_NAME = `Test Tenant ${Date.now()}`;

async function main() {
  console.log('🚀 Starting Realistic Robustness Test...');

  try {
    // 1. Register and Login (to get Token)
    // We need a tenant first to register a user linked to it? Or can we register without tenant?
    // Looking at auth.service.ts, tenantId seems required in DTO but maybe nullable in DB?
    // The error says "La fila que falla contiene ... null ... column firstName" but my previous attempt sent firstName.
    // Wait, the previous log showed "be40e713... null, null, test.admin..." 
    // It seems the DTO mapping might be failing or I am sending it wrong.
    
    // Let's create a tenant first using a seed or raw query? No, public registration flow.
    // Ah, the public registration flow usually creates tenant AND user.
    // Let's try /tenants/register if it exists, as per memory "Public Tenant Onboarding Flow".
    
    console.log('1️⃣  Registering Tenant & Admin via /tenants/register ...');
    const registerRes = await fetch(`${API_URL}/tenants/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: TENANT_NAME, // Changed from companyName to businessName per controller
        firstName: 'Test',
        lastName: 'Admin',
        email: EMAIL,
        password: PASSWORD,
        country: 'Colombia' 
      })
    });

    if (!registerRes.ok) {
        const text = await registerRes.text();
        throw new Error(`Registration failed: ${registerRes.status} ${text}`);
    }

    const registerData = await registerRes.json();
    // Assuming this returns { tenant, user, token } or similar.
    // Let's log keys to be sure
    console.log('   Registration keys:', Object.keys(registerData));
    
    let token = registerData.access_token || registerData.token;
    let tenantId = registerData.tenant?.id;

    if (!token) {
        // Try login if token not returned
        console.log('   Token not in response, trying login...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: EMAIL, password: PASSWORD })
        });
        
        if (!loginRes.ok) {
            const errText = await loginRes.text();
            console.error('Login failed:', loginRes.status, errText);
            throw new Error('Login failed after registration');
        }

        const loginData = await loginRes.json();
        token = loginData.accessToken; // Changed from access_token to accessToken based on AuthService
    }

    if (!token) throw new Error('Failed to obtain token');
    console.log('✅ Auth Token obtained.');

    // We might already have tenantId from registration
    if (!tenantId) {
        // Fetch tenant? Or use one if returned.
        // If /tenants/register creates it, we are good.
        // Let's see if we need to create another one or use the one created.
        if (registerData.tenant && registerData.tenant.id) {
             tenantId = registerData.tenant.id;
             console.log(`✅ Tenant created (via register): ${tenantId}`);
        }
    }
    
    // If we still don't have tenantId (e.g. if we fell back to login), we might need to find it
    // But for this test, let's assume register works.


    // 3. Create Product (Need one to order)
    console.log('3️⃣  Creating Product...');
    const productRes = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        name: 'Test Product', 
        price: 10000, 
        stock: 100, 
        tenantId: tenantId
      })
    });
    const product = await productRes.json();
    console.log(`✅ Product created: ${product.id}`);

    // 4. Connect to WebSocket (Simulate Frontend)
    console.log('4️⃣  Connecting to WebSocket (/notifications)...');
    const socket = io(`${API_URL}/notifications`, {
      auth: { token },
      transports: ['websocket']
    });

    const notificationPromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout waiting for notification')), 10000);
      
      socket.on('connect', () => {
        console.log('   🟢 Socket Connected!');
      });

      socket.on('notification', (data) => {
        clearTimeout(timeout);
        console.log('   🔔 Notification Received:', data);
        resolve(data);
      });
      
      socket.on('connect_error', (err) => {
          console.log('   🔴 Socket Connection Error:', err.message);
      });
    });

    // 5. Create Order (Triggering Email & Payment Logic)
    console.log('5️⃣  Creating Order (Triggering Email & Payments)...');
    // We use a fake email and 'card' method to trigger the external services
    const orderRes = await fetch(`${API_URL}/orders`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        tenantId: tenantId,
        items: [{ productId: product.id, quantity: 1, price: 10000 }],
        customerEmail: 'customer.real@example.com', // Should trigger email logic
        paymentMethod: 'card', // Should trigger payment link logic
        shippingAddress: { firstName: 'Juan', lastName: 'Perez' }
      })
    });

    if (!orderRes.ok) {
        const errText = await orderRes.text();
        throw new Error(`Failed to create order: ${orderRes.status} ${errText}`);
    }

    const order = await orderRes.json();
    console.log(`✅ Order Created: ${order.id}`);
    console.log('   (Backend should now be attempting to send email/payment link...)');

    // 6. Wait for Notification
    console.log('6️⃣  Waiting for Real-time Notification...');
    await notificationPromise;
    console.log('✅ Notification flow verified!');

    // 7. Verify Backend Survival
    // If we got here, the backend responded to the order creation and sent the socket event.
    // This implies it didn't crash synchronously.
    
    console.log('\n🎉 TEST PASSED: System handled the order, sent notification, and stayed alive.');
    
    socket.disconnect();

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    process.exit(1);
  }
}

main();
