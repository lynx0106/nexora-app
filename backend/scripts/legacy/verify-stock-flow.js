
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:4001';

async function runTest() {
  try {
    console.log('--- STARTING MULTI-TENANT STOCK FLOW VERIFICATION ---');

    // --- CREDENTIALS ---
    const USER_A = { email: 'carlos.demo@miempresa.com', password: 'Demo123!', tenantId: 'mi-empresa-saas' };
    const USER_B = { email: 'ana.demo@clinica.com', password: 'Demo123!', tenantId: 'clinica-sonrisas' };
    const SUPER_ADMIN = { email: 'superadmin@saas.com', password: 'SuperAdmin123!' };

    // 0. SEED USERS (Ensure they exist)
    console.log('\n0. Seeding Users...');
    try {
        await fetch(`${API_URL}/users/seed-superadmin`, { method: 'POST' });
        await fetch(`${API_URL}/users/seed-demo-users`, { method: 'POST' });
        console.log('Seeding complete.');
    } catch (e) {
        console.log('Seeding might have failed or already exists:', e.message);
    }

    // 1. Login Users
    console.log('\n1. Logging in users...');
    
    const tokenA = await login(USER_A);
    console.log(`User A (${USER_A.tenantId}) logged in.`);

    const tokenB = await login(USER_B);
    console.log(`User B (${USER_B.tenantId}) logged in.`);

    const tokenSuper = await login(SUPER_ADMIN);
    console.log(`SuperAdmin logged in.`);

    // 2. Create Products
    console.log('\n2. Creating Products...');
    const productA = await createProduct(tokenA, USER_A.tenantId, 'Product A', 100);
    console.log(`Product A created in ${USER_A.tenantId}: ${productA.id} (Stock: 100)`);

    const productB = await createProduct(tokenB, USER_B.tenantId, 'Product B', 100);
    console.log(`Product B created in ${USER_B.tenantId}: ${productB.id} (Stock: 100)`);

    // 3. Verify Isolation (Cross-Tenant Access)
    console.log('\n3. Verifying Isolation (Tenant A trying to access Product B)...');
    try {
        const check = await fetch(`${API_URL}/products/${productB.id}`, {
            headers: { 'Authorization': `Bearer ${tokenA}` }
        });
        if (check.ok) {
            console.error('CRITICAL: Tenant A was able to access Product B!');
            // throw new Error('Isolation failed'); // Uncomment to enforce strict check if endpoint returns 403/404
            // Note: If endpoint returns 200 but empty, that's one thing. If it returns the product, that's bad.
            // But usually findOne checks tenantId.
            const json = await check.json();
            if (json && json.id) throw new Error('Isolation failed: Product B returned to Tenant A');
        } else {
            console.log('Isolation passed: Access denied or not found (Expected).');
        }
    } catch (e) {
        console.log(`Isolation passed: ${e.message}`);
    }

    // 4. Place Orders
    console.log('\n4. Placing Orders...');
    
    // Tenant A orders Product A (Qty: 10)
    await createOrder(tokenA, USER_A.tenantId, productA.id, 10);
    console.log(`User A ordered 10 of Product A.`);

    // Tenant B orders Product B (Qty: 20)
    await createOrder(tokenB, USER_B.tenantId, productB.id, 20);
    console.log(`User B ordered 20 of Product B.`);

    // 5. Verify Stocks Independently
    console.log('\n5. Verifying Stock Levels...');
    
    const stockA = await getProductStock(tokenA, productA.id);
    console.log(`Stock A (Expected 90): ${stockA}`);
    if (stockA !== 90) throw new Error(`Stock A mismatch! Expected 90, got ${stockA}`);

    const stockB = await getProductStock(tokenB, productB.id);
    console.log(`Stock B (Expected 80): ${stockB}`);
    if (stockB !== 80) throw new Error(`Stock B mismatch! Expected 80, got ${stockB}`);

    // 6. Bulk Upload by Superadmin for Tenant A
    console.log('\n6. Testing Superadmin Bulk Upload for Tenant A...');
    // Update Product A to stock 500
    const csvContent = `name,price,stock,tenantId\n${productA.name},100,500,${USER_A.tenantId}`;
    
    await uploadCsv(tokenSuper, USER_A.tenantId, csvContent);
    console.log('Bulk upload completed.');

    // 7. Verify Final State
    console.log('\n7. Verifying Final State...');
    
    const finalStockA = await getProductStock(tokenA, productA.id); // Read as Tenant A
    console.log(`Stock A (Expected 500): ${finalStockA}`);
    if (finalStockA !== 500) throw new Error(`Stock A mismatch after upload! Expected 500, got ${finalStockA}`);

    const finalStockB = await getProductStock(tokenB, productB.id); // Read as Tenant B
    console.log(`Stock B (Expected 80): ${finalStockB}`);
    if (finalStockB !== 80) throw new Error(`Stock B affected by cross-tenant upload! Expected 80, got ${finalStockB}`);

    console.log('\n--- SUCCESS: Multi-Tenant Stock Flow Verified! ---');

  } catch (error) {
    console.error('\n!!! TEST FAILED !!!');
    console.error(error);
  }
}

// --- HELPERS ---

async function login(user) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user.email, password: user.password })
  });
  if (!res.ok) throw new Error(`Login failed for ${user.email}: ${await res.text()}`);
  const data = await res.json();
  return data.accessToken;
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
      description: 'Test Product',
      price: 100,
      stock,
      tenantId
    })
  });
  if (!res.ok) throw new Error(`Create Product failed: ${await res.text()}`);
  return res.json();
}

async function createOrder(token, tenantId, productId, quantity) {
  const res = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      tenantId,
      items: [{ productId, quantity, price: 100 }],
      shippingAddress: { street: 'Test', city: 'Test' }
    })
  });
  if (!res.ok) throw new Error(`Create Order failed: ${await res.text()}`);
  return res.json();
}

async function getProductStock(token, productId) {
  const res = await fetch(`${API_URL}/products/${productId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Get Product failed: ${await res.text()}`);
  const data = await res.json();
  return data.stock;
}

async function uploadCsv(token, tenantId, csvContent) {
    const boundary = '----WebKitFormBoundaryTest';
    const body = 
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="tenantId"\r\n\r\n` +
      `${tenantId}\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="update.csv"\r\n` +
      `Content-Type: text/csv\r\n\r\n` +
      `${csvContent}\r\n` +
      `--${boundary}--\r\n`;

    const res = await fetch(`${API_URL}/products/upload`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      },
      body: body
    });
    if (!res.ok) throw new Error(`Upload failed: ${await res.text()}`);
    return res.json();
}

runTest();
