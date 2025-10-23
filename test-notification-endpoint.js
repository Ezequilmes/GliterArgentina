const http = require('http');
const fs = require('fs');
const path = require('path');

/**
 * Busca archivos de token FCM en el directorio actual
 * @returns {Array} Array de objetos con token y userId
 */
function findFCMTokens() {
  const tokens = [];
  const files = fs.readdirSync(__dirname);
  
  // Buscar archivos que comiencen con 'fcm-token-'
  const tokenFiles = files.filter(file => file.startsWith('fcm-token-') && file.endsWith('.json'));
  
  tokenFiles.forEach(file => {
    try {
      const content = fs.readFileSync(path.join(__dirname, file), 'utf8');
      const data = JSON.parse(content);
      if (data.token) {
        tokens.push({
          token: data.token,
          userId: data.userId || 'test-user-123',
          source: file,
          timestamp: data.timestamp
        });
      }
    } catch (error) {
      console.warn(`⚠️  Error leyendo ${file}:`, error.message);
    }
  });
  
  return tokens;
}

/**
 * Muestra los tokens disponibles y permite seleccionar uno
 */
function selectToken() {
  const tokens = findFCMTokens();
  
  if (tokens.length === 0) {
    console.log('❌ No se encontraron tokens FCM reales.');
    console.log('');
    console.log('💡 Para obtener un token real:');
    console.log('1. Abre http://localhost:3000/test-fcm en tu navegador');
    console.log('2. Inicia sesión con un usuario real');
    console.log('3. Haz clic en "Obtener Token FCM Real"');
    console.log('4. Copia el token que aparezca');
    console.log('5. Ejecuta: node get-real-fcm-token.js');
    console.log('6. Pega el token en el formulario que se abre');
    console.log('');
    return null;
  }
  
  console.log(`📋 Se encontraron ${tokens.length} token(s) FCM real(es):`);
  tokens.forEach((token, index) => {
    console.log(`${index + 1}. Token: ${token.token.substring(0, 50)}...`);
    console.log(`   User ID: ${token.userId}`);
    console.log(`   Fuente: ${token.source}`);
    console.log(`   Fecha: ${token.timestamp || 'No disponible'}`);
    console.log('');
  });
  
  // Por ahora, usar el primer token
  return tokens[0];
}

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          text: () => Promise.resolve(data)
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

async function testNotificationEndpoint() {
  console.log('🧪 Probando el endpoint de notificación de prueba...\n');

  // Buscar tokens reales primero
  const realToken = selectToken();
  
  if (!realToken) {
    console.log('❌ No se puede continuar sin un token FCM real.');
    console.log('Por favor, obtén un token real siguiendo las instrucciones anteriores.\n');
    return;
  }

  console.log('✅ Usando token FCM real encontrado\n');

  // Payload de prueba con token FCM real
  const testPayload = {
    token: realToken.token,
    title: '🔔 Notificación de Prueba',
    body: 'Esta es una prueba del sistema de notificaciones push con token real',
    userId: realToken.userId
  };

  try {
    console.log('📤 Enviando solicitud al endpoint de prueba...');
    console.log('URL:', 'http://localhost:3000/api/test/send-notification/');
    console.log('Payload:', JSON.stringify(testPayload, null, 2));
    console.log('');

    const postData = JSON.stringify(testPayload);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/test/send-notification/',  // Añadida barra al final
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const response = await makeRequest(options, postData);
    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    
    const responseText = await response.text();
    console.log('📄 Response body:', responseText);
    
    try {
      const responseData = JSON.parse(responseText);
      console.log('\n✅ Respuesta parseada:');
      console.log(JSON.stringify(responseData, null, 2));
      
      if (responseData.success) {
        console.log('\n🎉 ¡Notificación enviada exitosamente!');
        console.log(`📱 Message ID: ${responseData.messageId}`);
      } else {
        console.log('\n❌ Error en la notificación:');
        console.log(`   Error: ${responseData.error}`);
        console.log(`   Detalles: ${responseData.details}`);
        console.log(`   Código: ${responseData.code}`);
      }
    } catch (parseError) {
      console.log('\n⚠️  No se pudo parsear la respuesta como JSON');
      console.log('Respuesta cruda:', responseText);
    }

  } catch (error) {
    console.error('\n💥 Error en la solicitud:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Sugerencia: Asegúrate de que el servidor esté ejecutándose en http://localhost:3000');
      console.log('   Ejecuta: npm run dev');
    }
  }
}

// Función para probar con diferentes tipos de tokens
async function testWithDifferentTokens() {
  console.log('🔄 Probando con diferentes escenarios...\n');
  
  // Caso 1: Token inválido
  console.log('📋 Caso 1: Token inválido');
  await testWithToken('token-invalido', '❌ Token Inválido', 'Probando con token inválido');
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Caso 2: Token vacío
  console.log('📋 Caso 2: Token vacío');
  await testWithToken('', '❌ Token Vacío', 'Probando con token vacío');
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Caso 3: Sin token
  console.log('📋 Caso 3: Sin token');
  await testWithToken(null, '❌ Sin Token', 'Probando sin token');
  
  // Prueba adicional con token real modificado (para verificar que el token es válido)
  const realToken = selectToken();
  if (realToken) {
    console.log('\n' + '='.repeat(50) + '\n');
    console.log('🔄 Prueba adicional con token real modificado:');
    const modifiedToken = realToken.token.slice(0, -5) + 'XXXXX';
    await testWithToken(modifiedToken, 'Token real modificado (debería fallar)', 'Probando con token real modificado');
  }
}

async function testWithToken(token, title, body) {
  try {
    const payload = token !== null ? { token, title, body, userId: 'test' } : { title, body, userId: 'test' };
    const postData = JSON.stringify(payload);
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/test/send-notification/',  // Añadida barra al final
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const response = await makeRequest(options, postData);
    const result = await response.text();
    console.log(`Status: ${response.status}`);
    console.log(`Response: ${result.substring(0, 200)}${result.length > 200 ? '...' : ''}`);
    
  } catch (error) {
    console.log(`Error: ${error.message}`);
  }
}

// Ejecutar las pruebas
console.log('🚀 Iniciando pruebas del endpoint de notificación...\n');

testNotificationEndpoint()
  .then(() => {
    console.log('\n' + '='.repeat(60) + '\n');
    return testWithDifferentTokens();
  })
  .then(() => {
    console.log('\n🏁 Pruebas completadas');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Error en las pruebas:', error);
    process.exit(1);
  });