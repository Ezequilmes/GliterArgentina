const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3000';

// Función para hacer peticiones HTTP
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const req = protocol.request(url, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            data: jsonData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            statusText: res.statusMessage,
            data: data
          });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    
    req.end();
  });
}

// Tests de endpoints
async function testEndpoints() {
  console.log('🧪 Iniciando pruebas de endpoints...\n');

  const tests = [
    {
      name: 'Health Check',
      url: `${BASE_URL}/api/health`,
      method: 'GET'
    },
    {
      name: 'Auth Status',
      url: `${BASE_URL}/api/auth/status`,
      method: 'GET'
    },
    {
      name: 'Get In-App Messages',
      url: `${BASE_URL}/api/in-app-messages/messages?userId=test&authenticated=true&sessionTime=5000`,
      method: 'GET'
    },
    {
      name: 'Create In-App Message',
      url: `${BASE_URL}/api/in-app-messages/messages`,
      method: 'POST',
      body: {
        title: 'Test Message',
        body: 'This is a test message',
        actionUrl: 'https://example.com',
        campaignName: 'test-campaign'
      }
    },
    {
      name: 'Get In-App Config',
      url: `${BASE_URL}/api/in-app-messages/config`,
      method: 'GET'
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      console.log(`📡 Testing ${test.name}...`);
      const result = await makeRequest(test.url, {
        method: test.method,
        body: test.body
      });
      
      if (result.status >= 200 && result.status < 300) {
        console.log(`✅ ${test.name}: ${result.status} ${result.statusText}`);
        passedTests++;
        if (typeof result.data === 'object') {
          console.log(`   Response: ${JSON.stringify(result.data, null, 2).substring(0, 150)}...`);
        } else {
          console.log(`   Response: ${result.data.substring(0, 100)}...`);
        }
      } else {
        console.log(`❌ ${test.name}: ${result.status} ${result.statusText}`);
        console.log(`   Error: ${JSON.stringify(result.data)}`);
      }
    } catch (error) {
      console.log(`💥 ${test.name}: Error - ${error.message}`);
    }
    console.log('');
  }

  console.log(`🏁 Pruebas completadas! ${passedTests}/${totalTests} endpoints funcionando correctamente.`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ¡Todos los endpoints están funcionando perfectamente!');
  } else {
    console.log('⚠️  Algunos endpoints necesitan revisión.');
  }
}

// Ejecutar tests
testEndpoints().catch(console.error);