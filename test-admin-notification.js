#!/usr/bin/env node

/**
 * Script para probar el endpoint de administración con tokens reales
 */

const http = require('http');
const fs = require('fs');

// Tokens FCM reales de Firestore
const realTokensFromFirestore = [
  "clyUfr1Af5tIE2lrs6Tmfm:APA91bFZXnlvKcQtVVi64ruADzSRkPsWKtRSvaB9l4olHSrZsv7DUmBwU_GHaFjuu-MPOdvVg4HXDanVPhCctNF7Gvd55gGpoWxsYOJjqJQsWL_rnzxfAbw",
  "eAAyjRj5e2zNiRGx205ujq:APA91bHPlC-_0FpkVdW70c1_ezGZJ6Z1PLLwpt3zY5Yoj-urvTzp053CQoAM3uuCU9-oJQmcb_8zsTQigdDGafmw35fMD-iXbuWYx1HjdXqoC8nWG6a3u5k"
];

function makeRequest(data, path = '/api/admin/send-notification') {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
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
    
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        // Manejar redirecciones
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          console.log(`🔄 Redirigiendo a: ${res.headers.location}`);
          makeRequest(data, res.headers.location).then(resolve).catch(reject);
          return;
        }
        
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
      console.error('❌ Error en la petición HTTP:', error.message);
      reject(error);
    });
    
    req.write(postData);
    req.end();
  });
}

async function testAdminNotification() {
  console.log('🚀 Probando endpoint de administración con tokens reales...\n');
  
  // Verificar la validez de los tokens
  console.log('📋 Verificando tokens:');
  realTokensFromFirestore.forEach((token, index) => {
    console.log(`   Token ${index + 1}: ${token}`);
    console.log(`   Longitud: ${token.length} caracteres`);
    console.log(`   Contiene ':APA91b': ${token.includes(':APA91b')}`);
    console.log('');
  });
  
  const payload = {
    title: "🧪 Prueba de Notificación Admin",
    message: "Esta es una notificación de prueba desde el panel de administración",
    targetType: "specific",
    targetUsers: ["AdmXpWgXbZXYGGkGICDSqG7rQWm2", "H6pJ38zqoiTzsuhjRpb2DE85HLz1"],
    adminEmail: "admin@gliter.com.ar"
  };
  
  console.log('📤 Enviando notificación de administración...');
  console.log('Payload:', JSON.stringify(payload, null, 2));
  console.log('');
  
  try {
    const response = await makeRequest(payload);
    
    console.log('📊 Resultado:');
    console.log(`   Código de respuesta: ${response.status}`);
    
    if (response.status === 200) {
      console.log('✅ Notificación enviada exitosamente');
      console.log('📄 Respuesta:', JSON.stringify(response.data, null, 2));
    } else {
      console.log('❌ Error al enviar la notificación');
      console.log('📄 Respuesta de error:', JSON.stringify(response.data, null, 2));
    }
    
  } catch (error) {
    console.log('❌ Error en la petición:', error.message);
  }
}

// Ejecutar la prueba
testAdminNotification().catch(console.error);