import axios from 'axios';

const API_URL = 'http://localhost:4001';

async function cleanupTestTenants() {
  try {
    // 1. Login as Superadmin
    console.log('Logging in as Superadmin...');
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'superadmin@saas.com',
      password: 'SuperAdmin123!'
    });
    const token = loginRes.data.accessToken;

    // 2. Call Cleanup Endpoint
    console.log('Calling Cleanup Endpoint...');
    const cleanupRes = await axios.delete(`${API_URL}/tenants/cleanup`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Cleanup Result:', cleanupRes.data);

  } catch (error: any) {
    console.error('Error during cleanup:', error.toJSON ? error.toJSON() : error);
    if (error.response) {
        console.error('Data:', error.response.data);
    }
  }
}

cleanupTestTenants();
