import { io } from 'socket.io-client';
import axios from 'axios';

const API_URL = 'http://localhost:4001';
const timestamp = Date.now();
const tenantName = `SimulacionChat-${timestamp}`;
const adminEmail = `admin-${timestamp}@test.com`;
const staffEmail = `staff-${timestamp}@test.com`;
const clientEmail = `client-${timestamp}@test.com`;
const password = 'Password123!';

async function main() {
  try {
    console.log('--- 1. Registering Tenant ---');
    const registerRes = await axios.post(`${API_URL}/tenants/register`, {
      name: tenantName,
      sector: 'service',
      country: 'Colombia',
      currency: 'COP',
      adminFirstName: 'Admin',
      adminLastName: 'Test',
      adminEmail: adminEmail,
      adminPassword: password,
    });
    const tenantId = registerRes.data.tenant.id;
    console.log(`Tenant created: ${tenantId} (${tenantName})`);

    console.log('--- 2. Logging in Admin ---');
    const adminLogin = await axios.post(`${API_URL}/auth/login`, {
      email: adminEmail,
      password: password,
    });
    const adminToken = adminLogin.data.accessToken;
    const decodeToken = (token: string) => {
        try {
            const payload = token.split('.')[1];
            return JSON.parse(Buffer.from(payload, 'base64').toString());
        } catch (e) { return {}; }
    };
    console.log('Admin logged in. Token Payload:', decodeToken(adminToken));

    console.log('--- 3. Creating Staff User ---');
    // Admin creates staff
    await axios.post(
      `${API_URL}/users`,
      {
        firstName: 'Staff',
        lastName: 'Test',
        email: staffEmail,
        password: password,
        role: 'staff',
        tenantId: tenantId,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    console.log('Staff user created.');

    console.log('--- 4. Creating Client User ---');
    // Admin creates client
    const clientRes = await axios.post(
      `${API_URL}/users`,
      {
        firstName: 'Cliente',
        lastName: 'Final',
        email: clientEmail,
        password: password,
        role: 'user',
        tenantId: tenantId,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    const clientId = clientRes.data.id;
    console.log(`Client user created: ${clientId}`);

    console.log('--- 5. Logging in Staff & Client ---');
    const staffLogin = await axios.post(`${API_URL}/auth/login`, {
      email: staffEmail,
      password: password,
    });
    const staffToken = staffLogin.data.accessToken;

    const clientLogin = await axios.post(`${API_URL}/auth/login`, {
      email: clientEmail,
      password: password,
    });
    const clientToken = clientLogin.data.accessToken;
    console.log('Staff and Client logged in.');

    console.log('--- 6. Connecting Sockets ---');

    const createSocket = (name: string, token: string) => {
      const socket = io(API_URL, {
        auth: { token },
      });
      socket.on('connect', () => {
        console.log(`[${name}] Connected (ID: ${socket.id})`);
      });
      socket.on('disconnect', () => {
        console.log(`[${name}] Disconnected`);
      });
      socket.on('connect_error', (err) => {
        console.log(`[${name}] Connection Error: ${err.message}`);
      });
      socket.on('newMessage', (msg) => {
          const senderName = msg.sender ? msg.sender.firstName : (msg.isAi ? 'AI Bot' : 'Unknown');
          console.log(`[${name}] 📩 Received: "${msg.content}" from ${senderName} (Scope: ${msg.scope})`);
        });
      socket.on('aiStatusChanged', (data) => {
        console.log(`[${name}] 🤖 AI Status Changed for user ${data.userId}: ${data.isAiActive}`);
      });
      return socket;
    };

    const adminSocket = createSocket('ADMIN', adminToken);
    const staffSocket = createSocket('STAFF', staffToken);
    const clientSocket = createSocket('CLIENT', clientToken);

    // Wait for connections
    await new Promise((r) => setTimeout(r, 2000));

    console.log('\n--- SCENARIO A: INTERNAL CHAT (Staff -> Admin) ---');
    console.log('[STAFF] Sending: "Hola Jefe, todo bien?" (Scope: INTERNAL)');
    staffSocket.emit('sendMessage', {
      content: 'Hola Jefe, todo bien?',
      scope: 'INTERNAL',
    });

    await new Promise((r) => setTimeout(r, 1500));
    
    console.log('\n--- SCENARIO B: INTERNAL CHAT (Admin -> Staff) ---');
    console.log('[ADMIN] Sending: "Todo excelente, sigue así." (Scope: INTERNAL)');
    adminSocket.emit('sendMessage', {
      content: 'Todo excelente, sigue así.',
      scope: 'INTERNAL',
    });

    await new Promise((r) => setTimeout(r, 1500));

    console.log('\n--- SCENARIO C: CUSTOMER CHAT (Client -> Business) ---');
    // Client sends message to their own scope
    console.log('[CLIENT] Sending: "Hola, tengo una consulta sobre mi pedido." (Scope: CUSTOMER)');
    clientSocket.emit('sendMessage', {
      content: 'Hola, tengo una consulta sobre mi pedido.',
      scope: 'CUSTOMER',
      targetUserId: clientId, // Optional for client, but good practice
    });

    await new Promise((r) => setTimeout(r, 3000)); // Wait longer for potential AI response

    console.log('\n--- SCENARIO D: ADMIN REPLY TO CUSTOMER ---');
    console.log('[ADMIN] Sending: "Hola Cliente, dime tu número de pedido." (Scope: CUSTOMER)');
    adminSocket.emit('sendMessage', {
        content: 'Hola Cliente, dime tu número de pedido.',
        scope: 'CUSTOMER',
        targetUserId: clientId
    });

    await new Promise((r) => setTimeout(r, 2000));

    console.log('\n--- SCENARIO E: STAFF REPLY TO CUSTOMER ---');
    console.log('[STAFF] Sending: "Ya lo reviso en sistema." (Scope: CUSTOMER)');
    staffSocket.emit('sendMessage', {
        content: 'Ya lo reviso en sistema.',
        scope: 'CUSTOMER',
        targetUserId: clientId
    });

    await new Promise((r) => setTimeout(r, 2000));

    console.log('\n--- Finishing Simulation ---');
    adminSocket.disconnect();
    staffSocket.disconnect();
    clientSocket.disconnect();

  } catch (error: any) {
    console.error('Error details:', error.response?.data || error.message);
  }
}

main();
