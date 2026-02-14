
// const fetch = require('node-fetch'); // Ensure node-fetch is installed or use global fetch if Node 18+

const API_URL = 'http://localhost:4001';
const TEST_CASES = [
    {
        tenantId: 'tech-master',
        email: 'admin@techmaster.com',
        password: 'Admin123!'
    },
    {
        tenantId: 'abastos-la-frescura',
        email: 'admin@abastos.com',
        password: 'Admin123!'
    }
];

(async () => {
    for (const testCase of TEST_CASES) {
        console.log(`\n\n==============================================`);
        console.log(`TESTING TENANT: ${testCase.tenantId}`);
        console.log(`==============================================`);
        
        const { tenantId, email, password } = testCase;

        try {
            // 1. Login
            console.log('Logging in...');
            const loginRes = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!loginRes.ok) throw new Error(`Login failed: ${await loginRes.text()}`);
            const { accessToken } = await loginRes.json();
            console.log('Login successful.');

            // 2. Get Products to pick one
            const productsRes = await fetch(`${API_URL}/products?tenantId=${tenantId}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const products = await productsRes.json();
            console.log(`Products Response:`, JSON.stringify(products).substring(0, 200));
            
            if (!Array.isArray(products) || products.length === 0) {
                console.log('No products found for this tenant. Skipping order creation.');
                continue;
            }
            
            const productToOrder = products[0];
            console.log(`Selected product: ${productToOrder.name} (Stock: ${productToOrder.stock})`);

            // 3. Update stock to ensure we can order
            await fetch(`${API_URL}/products/${productToOrder.id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({ stock: 100 })
            });

            // 4. Create Order
            const createOrderRes = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    tenantId,
                    userId: 'test-user-id',
                    items: [
                        { 
                            productId: productToOrder.id, 
                            quantity: 2,
                            price: Number(productToOrder.price)
                        }
                    ],
                    total: Number(productToOrder.price) * 2,
                    status: 'completed',
                    shippingAddress: { street: 'Test St', city: 'Test City', country: 'Test Country' }
                })
            });

            if (createOrderRes.ok) {
                const order = await createOrderRes.json();
                console.log(`Order created: ${order.id}`);

                // 5. Verify Image in Order Details
                const orderRes = await fetch(`${API_URL}/orders/${order.id}`, {
                    headers: { 'Authorization': `Bearer ${accessToken}` }
                });
                
                let fetchedOrder;
                if (orderRes.ok) {
                    fetchedOrder = await orderRes.json();
                } else {
                    // Fallback to list
                    const listRes = await fetch(`${API_URL}/orders/tenant/${tenantId}`, {
                        headers: { 'Authorization': `Bearer ${accessToken}` }
                    });
                    const list = await listRes.json();
                    console.log(`List length: ${list.length}`);
                    if (list.length > 0) {
                        console.log(`First ID in list: ${list[0].id}`);
                        console.log(`Looking for ID: ${order.id}`);
                    }
                    fetchedOrder = list.find(o => o.id === order.id);
                }
                
                if (fetchedOrder && fetchedOrder.items && fetchedOrder.items[0].product.imageUrl) {
                      console.log(`✅ Order Item Image: ${fetchedOrder.items[0].product.imageUrl}`);
                 } else {
                      console.log(`⚠️ Order Item Image MISSING`);
                      console.log('Fetched Order First Item:', JSON.stringify(fetchedOrder?.items?.[0], null, 2));
                 }
            } else {
                console.log('Failed to create order');
            }

            // 6. Verify Top Products
             const topProductsRes = await fetch(`${API_URL}/orders/top-products/${tenantId}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const topProducts = await topProductsRes.json();
            console.log(`Top Products found: ${topProducts.length}`);
            if (topProducts.length > 0) {
                console.log(`Top Product Image: ${topProducts[0].imageUrl}`);
            }

        } catch (error) {
            console.error(`Error testing ${tenantId}:`, error);
        }
    }
})();

// Commenting out old code to avoid conflict
/*
const SUPERADMIN_EMAIL = 'admin@techmaster.com';
const SUPERADMIN_PASSWORD = 'Admin123!';
const API_URL = 'http://localhost:3001';
// ... rest of old code
*/
