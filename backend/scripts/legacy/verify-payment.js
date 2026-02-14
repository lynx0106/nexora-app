const API_URL = 'http://127.0.0.1:4001';

async function verifyPaymentFlow() {
  console.log('--- Verifying Payment Flow ---');

  // 1. Login as Superadmin
  console.log('1. Logging in...');
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'superadmin@saas.com', password: 'SuperAdmin123!' })
  });
  
  if (!loginRes.ok) throw new Error('Login failed');
  const { accessToken } = await loginRes.json();
  console.log('Token:', accessToken.substring(0, 10) + '...');
  const headers = { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' };

  // 2. Create Order with Payment Info
  console.log('2. Creating Paid Order...');
  
  // Need a product first
  const productsRes = await fetch(`${API_URL}/products`, { headers });
  const products = await productsRes.json();
  if (!Array.isArray(products)) {
      console.error('Products response:', products);
      throw new Error('Products is not an array');
  }
  if (products.length === 0) throw new Error('No products found');
  const product = products[0];

  const orderData = {
    tenantId: product.tenantId,
    items: [{ productId: product.id, quantity: 1, price: 10 }],
    paymentStatus: 'paid',
    paymentMethod: 'card'
  };

  const createRes = await fetch(`${API_URL}/orders`, {
    method: 'POST',
    headers,
    body: JSON.stringify(orderData)
  });

  if (!createRes.ok) {
      const txt = await createRes.text();
      throw new Error(`Create Order failed: ${txt}`);
  }
  const order = await createRes.json();
  console.log(`   Order created: ${order.id}`);

  // 3. Verify Payment Fields
  if (order.paymentStatus !== 'paid') throw new Error(`Expected paymentStatus 'paid', got ${order.paymentStatus}`);
  if (order.paymentMethod !== 'card') throw new Error(`Expected paymentMethod 'card', got ${order.paymentMethod}`);
  console.log('   Payment fields verified successfully!');

  // 4. Update Payment Status
  console.log('4. Updating Payment Status to pending...');
  const updateRes = await fetch(`${API_URL}/orders/${order.id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ paymentStatus: 'pending' })
  });
  
  if (!updateRes.ok) throw new Error('Update failed');
  const updatedOrder = await updateRes.json();
  
  if (updatedOrder.paymentStatus !== 'pending') throw new Error('Update check failed');
  console.log('   Update verified!');

  console.log('--- Verification Complete ---');
}

verifyPaymentFlow().catch(console.error);
