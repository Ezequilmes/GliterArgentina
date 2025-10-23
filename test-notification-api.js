const fetch = require('node-fetch');

async function testNotificationAPI() {
  console.log('🧪 Testing Notification API after build fix...\n');

  // Test development environment
  console.log('📍 Testing Development (localhost:3000)');
  try {
    const devResponse = await fetch('http://localhost:3000/api/admin/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Notification',
        body: 'Testing after build fix',
        targetType: 'all'
      })
    });

    console.log(`Status: ${devResponse.status}`);
    const devText = await devResponse.text();
    
    try {
      const devData = JSON.parse(devText);
      console.log('Response:', JSON.stringify(devData, null, 2));
    } catch (e) {
      console.log('Response (not JSON):', devText.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ Development API Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test production environment with trailing slash
  console.log('📍 Testing Production with trailing slash');
  try {
    const prodResponse = await fetch('https://my-web-app--gliter-argentina.us-central1.hosted.app/api/admin/send-notification/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Test Notification',
        body: 'Testing after build fix',
        targetType: 'all'
      })
    });

    console.log(`Status: ${prodResponse.status}`);
    const prodText = await prodResponse.text();
    
    try {
      const prodData = JSON.parse(prodText);
      console.log('Response:', JSON.stringify(prodData, null, 2));
    } catch (e) {
      console.log('Response (not JSON):', prodText.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ Production API Error:', error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test health API for comparison
  console.log('📍 Testing Health API (for comparison)');
  try {
    const healthResponse = await fetch('https://my-web-app--gliter-argentina.us-central1.hosted.app/api/health/', {
      method: 'GET'
    });

    console.log(`Health API Status: ${healthResponse.status}`);
    const healthText = await healthResponse.text();
    
    try {
      const healthData = JSON.parse(healthText);
      console.log('Health Response:', JSON.stringify(healthData, null, 2));
    } catch (e) {
      console.log('Health Response (not JSON):', healthText.substring(0, 200));
    }
  } catch (error) {
    console.log('❌ Health API Error:', error.message);
  }
}

testNotificationAPI();