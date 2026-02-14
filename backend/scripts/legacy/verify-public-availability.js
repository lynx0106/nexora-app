const API_URL = 'http://127.0.0.1:4001';
const TENANT_ID = 'tenant-public-test';

async function verifyPublicAvailability() {
  console.log('--- Verifying Public Availability ---');

  try {
    // 1. Get Tenant Info
    console.log('1. Fetching Tenant Info...');
    const infoRes = await fetch(`${API_URL}/public/tenant/${TENANT_ID}`);
    if (!infoRes.ok) throw new Error(`Failed to fetch tenant info: ${infoRes.statusText}`);
    const tenant = await infoRes.json();
    console.log('   Tenant Opening Time:', tenant.openingTime);
    console.log('   Tenant Closing Time:', tenant.closingTime);
    console.log('   Appointment Duration:', tenant.appointmentDuration); 
    
    // 2. Check Availability
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    console.log(`2. Checking availability for ${dateStr}...`);
    const availRes = await fetch(`${API_URL}/public/availability/${TENANT_ID}?date=${dateStr}`);
    if (!availRes.ok) throw new Error(`Failed to fetch availability: ${availRes.statusText}`);
    const slots = await availRes.json();
    
    console.log(`   Found ${slots.length} slots.`);
    if (slots.length > 0) {
        console.log('   First slot:', slots[0]);
        console.log('   Last slot:', slots[slots.length - 1]);
    } else {
        console.warn('   No slots found! Check tenant opening hours.');
    }

    // 3. Verify Slot Interval
    if (slots.length >= 2) {
        const first = new Date(slots[0]);
        const second = new Date(slots[1]);
        const diffMinutes = (second - first) / 1000 / 60;
        console.log(`   Slot Interval: ${diffMinutes} minutes`);
    }

  } catch (error) {
    console.error('Error during verification:', error.message);
  }
}

verifyPublicAvailability();
