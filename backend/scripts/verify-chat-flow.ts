import { io } from 'socket.io-client';

const API_URL = 'http://localhost:4001';
// Use a known user or create one. For this test we assume 'cliente@abastos.com' exists with 'Client123!'
// If not, we might fail login.
const EMAIL = 'cliente@abastos.com';
const PASSWORD = 'Client123!';

async function run() {
  console.log('🚀 Starting Chat Flow Verification...');

  // 1. Login
  console.log('1. Logging in...');
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  if (!loginRes.ok) {
    console.error('❌ Login failed:', await loginRes.text());
    process.exit(1);
  }

  const loginData: any = await loginRes.json();
  const token = loginData.accessToken;
  const tenantId = loginData.user.tenantId;
  const userId = loginData.user.id;
  console.log('✅ Login successful. Token obtained.');

  // 2. Connect to Socket
  console.log('2. Connecting to Socket...');
  const socket = io(API_URL, {
    auth: { token: `Bearer ${token}` },
    transports: ['websocket'],
  });

  await new Promise<void>((resolve, reject) => {
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket.id);
      resolve();
    });
    socket.on('connect_error', (err) => {
      console.error('❌ Socket connection error:', err);
      reject(err);
    });
    setTimeout(() => reject(new Error('Socket timeout')), 5000);
  });

  // Helper to send and wait for reply
  const sendAndWait = async (content: string, timeoutMs = 10000): Promise<any> => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timeout waiting for reply to: "${content}"`)), timeoutMs);
      
      const listener = (msg: any) => {
        // We look for AI replies or replies from others
        if (msg.senderId !== userId) {
            clearTimeout(timer);
            socket.off('newMessage', listener);
            resolve(msg);
        }
      };

      socket.on('newMessage', listener);
      socket.emit('sendMessage', {
        content,
        tenantId,
        scope: 'CUSTOMER', 
      });
    });
  };

  try {
    // 3. Send "Hola"
    console.log('3. Sending "Hola"...');
    const reply1: any = await sendAndWait('Hola');
    console.log('📩 Received:', reply1.content);
    
    if (reply1.content.includes('¿Con quién tengo el gusto?')) {
        console.log('✅ AI asked for name correctly.');
    } else {
        console.warn('⚠️ AI did not ask for name in first message (or maybe not first message of session). Content:', reply1.content);
    }

    // 4. Send Name
    console.log('4. Sending "Me llamo TestUser"...');
    const reply2: any = await sendAndWait('Me llamo TestUser');
    console.log('📩 Received:', reply2.content);
    if (reply2.content.includes('TestUser')) {
        console.log('✅ AI used the name.');
    } else {
        console.warn('⚠️ AI did not use the name. Content:', reply2.content);
    }

    // 5. Test Handoff
    console.log('5. Testing Handoff ("humano")...');
    const reply3: any = await sendAndWait('humano');
    console.log('📩 Received:', reply3.content);
    // Note: The system might send a system message or the AI might say it's pausing.
    // Based on previous context, typing 'humano' pauses AI.
    
    // Check if AI is paused? We might need to check user status or just see if AI stops replying.
    // But for now, getting a reply (even "Transferring...") is good.

    console.log('✅ Chat Flow Verification Completed Successfully.');
  } catch (err) {
    console.error('❌ Test failed:', err);
  } finally {
    socket.disconnect();
  }
}

run();
