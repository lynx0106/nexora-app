const API_KEY = 're_YhZdym7n_MTNtM7ubCkwQSyGsvcVGFe2Z';

async function checkDomainStatus() {
  try {
    const response = await fetch('https://api.resend.com/domains', {
      headers: {
        'Authorization': `Bearer ${API_KEY}`
      }
    });

    const data = await response.json();
    
    if (data.error) {
        console.error('Error API:', data);
        return;
    }

    const domain = data.data.find(d => d.name === 'nexora-app.online');
    if (domain) {
      console.log(`Domain: ${domain.name}`);
      console.log(`Status: ${domain.status}`);
      console.log('Records:');
      if (domain.records) {
          domain.records.forEach(r => {
            console.log(`- ${r.record} (${r.type}): ${r.status}`);
          });
      }
      
      if (domain.status === 'verified') {
        console.log('\n✅ DOMINIO VERIFICADO EXITOSAMENTE');
      } else {
        console.log('\n⏳ Aún pendiente de verificación.');
        // Try to verify
        if (domain.status === 'not_started' || domain.status === 'pending') {
             console.log('Intentando verificar...');
             const verifyRes = await fetch(`https://api.resend.com/domains/${domain.id}/verify`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${API_KEY}` }
             });
             if (verifyRes.ok) {
                 console.log('Solicitud de verificación enviada.');
             } else {
                 console.log('Error al solicitar verificación:', await verifyRes.text());
             }
        }
      }
    } else {
      console.log('Dominio no encontrado.');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkDomainStatus();
