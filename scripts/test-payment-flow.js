
const API_URL = 'http://localhost:3000/api';
const TENANT_ID = 'verify-restaurant-tenant';

async function runTest() {
  try {
    console.log('1. Fetching products...');
    const productsRes = await fetch(`${API_URL}/public/products/${TENANT_ID}`);
    if (!productsRes.ok) throw new Error(`Failed to fetch products: ${productsRes.statusText}`);
    const products = await productsRes.json();

    if (!products || products.length === 0) {
      console.error('No products found for tenant');
      return;
    }

    const product = products[0];
    console.log(`   Found product: ${product.name} ($${product.price})`);

    console.log('2. Creating Order...');
    const orderPayload = {
      items: [
        {
          productId: product.id,
          quantity: 1,
          price: product.price
        }
      ],
      customerName: 'Test User',
      customerEmail: 'test@example.com',
      paymentMethod: 'card'
    };

    const orderRes = await fetch(`${API_URL}/public/order/${TENANT_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
    });
    if (!orderRes.ok) throw new Error(`Failed to create order: ${orderRes.statusText}`);
    const order = await orderRes.json();
    
    console.log(`   Order Created! ID: ${order.id}`);
    console.log(`   Initial Status: ${order.status}, Payment: ${order.paymentStatus}`);

    console.log('3. Simulating Webhook Payment...');
    // We send a POST to the webhook
    const webhookUrl = `${API_URL}/payments/webhook?topic=payment&id=sim_${order.id}_approved&tenantId=${TENANT_ID}`;
    const webhookRes = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    });
    
    if (!webhookRes.ok) throw new Error(`Webhook failed: ${webhookRes.statusText}`);
    console.log('   Webhook sent!');

    console.log('4. Verifying Order Status...');
    // Wait a bit
    await new Promise(r => setTimeout(r, 1000));

    const statusRes = await fetch(`${API_URL}/public/orders/${order.id}`);
    const updatedOrder = await statusRes.json();

    console.log(`   Updated Status: ${updatedOrder.status}`);
    console.log(`   Updated Payment: ${updatedOrder.paymentStatus}`);

    if (updatedOrder.paymentStatus === 'paid') {
      console.log('✅ TEST PASSED: Order marked as PAID.');
    } else {
      console.error('❌ TEST FAILED: Order not paid.');
    }

  } catch (error) {
    console.error('Test Failed:', error.message);
  }
}

runTest();
