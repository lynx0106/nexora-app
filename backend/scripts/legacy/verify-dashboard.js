// const fetch = require('node-fetch'); // Native fetch in Node 18+

const API_URL = 'http://127.0.0.1:4001';
const SUPER_ADMIN = { email: 'superadmin@saas.com', password: 'SuperAdmin123!' };
const TENANT_ID = `tenant-dashboard-${Date.now()}`;

async function login(credentials) {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
    });
    if (!res.ok) throw new Error(`Login failed: ${await res.text()}`);
    return (await res.json()).accessToken;
}

async function createProduct(token, tenantId, name, price) {
    const res = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            tenantId,
            name,
            description: 'Test Product',
            price,
            stock: 100,
            category: 'General'
        })
    });
    if (!res.ok) throw new Error(`Product creation failed: ${await res.text()}`);
    return await res.json();
}

async function createOrder(token, tenantId, productId) {
    const res = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            tenantId,
            items: [{ productId, quantity: 1, price: 50 }],
            customerEmail: 'customer@test.com'
        })
    });
    if (!res.ok) throw new Error(`Order creation failed: ${await res.text()}`);
    return await res.json();
}

async function createAppointment(token, tenantId, serviceId) {
    const res = await fetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            tenantId,
            clientId: 'some-user-id', // We might need a real user ID here if foreign key is enforced, but let's try.
            // If FK is enforced, we'll need to create a user first. Let's see.
            // Actually, Appointments usually require a client.
            // Let's skip appointment creation if it's too complex for now, or fetch a user.
            // Or better, let's create a client user first.
            dateTime: new Date().toISOString(),
            serviceId
        })
    });
    // If it fails due to FK, we'll handle it.
    if (!res.ok) console.log(`Appointment creation failed (expected if no user): ${await res.text()}`);
    else return await res.json();
}

async function verifyDashboard() {
    try {
        console.log('0. Seeding SuperAdmin...');
        await fetch(`${API_URL}/users/seed-superadmin`, { method: 'POST' }).catch(() => {});

        console.log('\n1. Logging in SuperAdmin...');
        const token = await login(SUPER_ADMIN);
        console.log('SuperAdmin logged in.');

        console.log('\n2. Creating Data for Dashboard...');
        const product = await createProduct(token, TENANT_ID, 'Dashboard Item', 50);
        await createOrder(token, TENANT_ID, product.id);
        console.log('Order created.');

        console.log('\n3. Testing Recent Activity Endpoint...');
        const activityRes = await fetch(`${API_URL}/dashboard/activity/${TENANT_ID}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!activityRes.ok) throw new Error(`Activity fetch failed: ${await activityRes.text()}`);
        const activity = await activityRes.json();
        console.log(`Activity items found: ${activity.length}`);
        if (activity.length > 0) {
            console.log('First activity item:', activity[0]);
            if (activity[0].type !== 'order') throw new Error('Expected order in activity');
        } else {
            throw new Error('No activity found despite creating an order!');
        }

        console.log('\n4. Testing Sales Chart Endpoint...');
        const chartRes = await fetch(`${API_URL}/dashboard/charts/sales/${TENANT_ID}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!chartRes.ok) throw new Error(`Chart fetch failed: ${await chartRes.text()}`);
        const chart = await chartRes.json();
        console.log(`Chart data points: ${chart.length}`);
        
        const todayStr = new Date().toISOString().split('T')[0];
        const todayData = chart.find(d => d.date === todayStr);
        if (!todayData || Number(todayData.total) !== 50) {
             console.log('Chart Data:', chart);
             throw new Error(`Chart data mismatch! Expected 50 for ${todayStr}, got ${todayData?.total}`);
        }
        console.log('Chart data verified.');

        console.log('\n--- SUCCESS: Dashboard Endpoints Verified! ---');

    } catch (error) {
        console.error('\n!!! VERIFICATION FAILED !!!');
        console.error(error);
        process.exit(1);
    }
}

verifyDashboard();
