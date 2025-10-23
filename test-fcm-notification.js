#!/usr/bin/env node

/**
 * Script para probar notificaciones FCM con tokens reales
 * Este script lee tokens desde el archivo o permite ingresar uno manualmente
 */

const http = require('http');
const fs = require('fs');

// Función para hacer peticiones HTTP
function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/api/test/send-notification',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            status: res.statusCode,
            data: parsedData
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: { error: responseData }
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

async function testNotification() {
  console.log('🚀 Probando notificaciones FCM...\n');
  
  let token = null;
  
  // Intentar leer token del archivo
  try {
    if (fs.existsSync('real-fcm-token.json')) {
      const tokenData = JSON.parse(fs.readFileSync('real-fcm-token.json', 'utf8'));
      token = tokenData.token;
      console.log('📖 Token encontrado en real-fcm-token.json');
    } else if (fs.existsSync('fcm-tokens.json')) {
      const tokensData = JSON.parse(fs.readFileSync('fcm-tokens.json', 'utf8'));
      if (tokensData.tokens && tokensData.tokens.length > 0) {
        token = tokensData.tokens[0].token;
        console.log('📖 Token encontrado en fcm-tokens.json');
      }
    }
  } catch (error) {
    console.log('⚠️ No se pudo leer archivo de tokens:', error.message);
  }
  
  // Si no hay token, pedirlo al usuario
  if (!token) {
    console.log('❌ No se encontró token FCM guardado');
    console.log('💡 Por favor, obtén un token real desde: http://localhost:3001/test-fcm');
    console.log('   1. Abre la página en tu navegador');
    console.log('   2. Acepta los permisos de notificación');
    console.log('   3. Copia el token FCM que aparece');
    console.log('');
    
    // Leer token del input (requiere modulo readline)
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    token = await new Promise((resolve) => {
      rl.question('📋 Ingresa el token FCM: ', (answer) => {
        rl.close();
        resolve(answer.trim());
      });
    });
    
    if (!token || token.length < 50) {
      console.log('❌ Token inválido');
      return;
    }
    
    // Guardar token para futuras pruebas
    const tokenData = {
      token: token,
      timestamp: new Date().toISOString()
    };
    fs.writeFileSync('real-fcm-token.json', JSON.stringify(tokenData, null, 2));
    console.log('💾 Token guardado para futuras pruebas');
  }
  
  console.log(`\n🔑 Usando token: ${token.substring(0, 30)}...`);
  
  // Configurar datos de la notificación
  const notificationData = {
    token: token,
    title: '📱 Notificación de Prueba',
    body: '¡Hola! Esta es una notificación de prueba desde Gliter Argentina',
    icon: '/icon-192x192.png',
    badge: '/icon-144x144.png',
    vibrate: [200, 100, 200],
    requireInteraction: true,
    tag: 'test-notification',
    actions: [
      { action: 'view', title: 'Ver' },
      { action: 'close', title: 'Cerrar' }
    ],
    data: {
      type: 'test',
      timestamp: Date.now().toString(),
      url: '/chat'
    }
  };
  
  console.log('\n📤 Enviando notificación...');
  console.log('📋 Datos:', JSON.stringify(notificationData, null, 2));
  
  try {
    const response = await makeRequest('http://localhost:3001/api/test/send-notification', notificationData);
    
    console.log('\n✅ Respuesta recibida!');
    console.log('📊 Estado:', response.status);
    console.log('📄 Datos:', response.data);
    
    if (response.status === 200 && response.data.success) {
      console.log('🎉 La notificación fue enviada correctamente');
      console.log('📱 Verifica tu dispositivo para ver la notificación');
    } else if (response.data.error) {
      console.error('\n❌ Error enviando notificación:');
      console.error('💬 Mensaje:', response.data.error);
      
      // Manejar errores específicos
      const errorMsg = response.data.error.toLowerCase();
      if (errorMsg.includes('invalid-registration-token')) {
        console.log('\n💡 El token es inválido. Obtén un nuevo token desde la página de prueba.');
      } else if (errorMsg.includes('registration-token-not-registered')) {
        console.log('\n💡 El token ya no está registrado. El usuario debe volver a registrarse.');
      } else if (errorMsg.includes('message-rate-exceeded')) {
        console.log('\n💡 Has excedido el límite de mensajes. Espera unos minutos.');
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error enviando notificación:');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('📡 No se pudo conectar al servidor');
      console.error('💡 Asegúrate de que el servidor esté ejecutándose en http://localhost:3001');
    } else {
      console.error('💥 Error:', error.message);
    }
  }
}

// Ejecutar el script
if (require.main === module) {
  testNotification().catch(error => {
    console.error('❌ Error en el script:', error);
    process.exit(1);
  });
}

module.exports = { testNotification };