#!/usr/bin/env node

/**
 * Script para probar notificaciones FCM con tokens existentes
 * Usa tokens FCM reales de usuarios en Firestore
 */

const http = require('http');
const fs = require('fs');

// Tokens FCM encontrados en Firestore
const existingTokens = [
  "clyUfr1Af5tIE2lrs6Tmfm:APA91bFZXnlvKcQtVVi64ruADzSRkPsWKtRSvaB9l4olHSrZsv7DUmBwU_GHaFjuu-MPOdvVg4HXDanVPhCctNF7Gvd55gGpoWxsYOJjqJQsWL_rnzxfAbw"
];

async function sendTestNotification(token) {
  const payload = {
    token: token,
    title: "🚀 Prueba de Notificación FCM",
    body: "Esta es una notificación de prueba desde el script",
    type: "test",
    data: {
      type: "test",
      timestamp: Date.now().toString(),
      senderId: "admin-test",
      title: "🚀 Prueba de Notificación FCM",
      body: "Esta es una notificación de prueba desde el script"
    }
  };

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(payload);
    
    const makeRequest = (path) => {
      const options = {
        hostname: 'localhost',
        port: 3001,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      
      console.log(`🌐 Enviando a: http://localhost:3001${options.path}`);

      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          // Manejar redirecciones
          if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            console.log(`🔄 Redirigiendo a: ${res.headers.location}`);
            makeRequest(res.headers.location);
            return;
          }
          
          try {
            const response = JSON.parse(data);
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: response
            });
          } catch (error) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: { error: 'Invalid JSON response', rawData: data }
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(postData);
      req.end();
    };

    makeRequest('/api/test/send-notification/');
  });
}

async function main() {
  console.log('🚀 Probando notificaciones FCM con tokens existentes...\n');
  
  // Mostrar tokens disponibles
  console.log('📱 Tokens FCM encontrados en Firestore:');
  existingTokens.forEach((token, index) => {
    console.log(`   ${index + 1}. ${token.substring(0, 50)}...`);
  });
  console.log('');
  
  // Probar con el primer token
  const testToken = existingTokens[0];
  console.log(`🎯 Probando con token: ${testToken.substring(0, 50)}...`);
  
  try {
    const response = await sendTestNotification(testToken);
    
    console.log('\n📊 Resultado de la prueba:');
    console.log(`   Código de respuesta: ${response.statusCode}`);
    
    if (response.statusCode === 200) {
      console.log('✅ Notificación enviada exitosamente');
      console.log('📄 Respuesta completa:');
      console.log(JSON.stringify(response.body, null, 2));
      
      // Guardar el resultado
      const resultData = {
        token: testToken,
        timestamp: new Date().toISOString(),
        response: response.body,
        status: 'success'
      };
      
      fs.writeFileSync('fcm-test-result.json', JSON.stringify(resultData, null, 2));
      console.log('\n💾 Resultado guardado en: fcm-test-result.json');
      
    } else {
      console.log('❌ Error al enviar la notificación');
      console.log('📄 Respuesta del servidor:');
      console.log(JSON.stringify(response.body, null, 2));
      
      // Guardar el error
      const errorData = {
        token: testToken,
        timestamp: new Date().toISOString(),
        statusCode: response.statusCode,
        error: response.body,
        status: 'error'
      };
      
      fs.writeFileSync('fcm-test-error.json', JSON.stringify(errorData, null, 2));
      console.log('\n💾 Error guardado en: fcm-test-error.json');
    }
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    
    // Guardar el error de conexión
    const connectionError = {
      token: testToken,
      timestamp: new Date().toISOString(),
      error: error.message,
      status: 'connection_error'
    };
    
    fs.writeFileSync('fcm-connection-error.json', JSON.stringify(connectionError, null, 2));
  }
  
  console.log('\n📝 Prueba completada');
}

// Ejecutar el script
main().catch(console.error);