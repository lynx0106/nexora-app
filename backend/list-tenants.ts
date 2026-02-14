import axios from 'axios';

const API_URL = 'http://localhost:4001';

async function listTenants() {
  try {
    // 1. Login as Superadmin to get the list
    const loginRes = await axios.post(`${API_URL}/auth/login`, {
      email: 'superadmin@saas.com',
      password: 'SuperAdmin123!'
    });
    const token = loginRes.data.accessToken;

    // 2. Get Tenants
    const tenantsRes = await axios.get(`${API_URL}/users/tenants/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Available Tenants:');
    tenantsRes.data.forEach((t: any) => {
        console.log(`- [${t.sector}] ${t.name} (ID: ${t.tenantId})`);
    });

  } catch (error: any) {
    console.error('Full Error:', error);
    if (error.response) {
        console.error('Response data:', error.response.data);
    }
  }
}

listTenants();
