#!/usr/bin/env node

/**
 * Script de verificación de credenciales de MercadoPago
 * 
 * Este script verifica que las credenciales de MercadoPago estén configuradas
 * correctamente y sean válidas para el entorno de producción.
 */

const https = require('https');

// Credenciales esperadas para producción
const EXPECTED_CREDENTIALS = {
  PUBLIC_KEY: 'APP_USR-eef5b234-f79b-46ab-aa28-ffd2369f8060',
  ACCESS_TOKEN: 'APP_USR-2100654215920021-090302-fcde5bf150a88e7b9f2223ca0dd2a1e0-93900446',
  CLIENT_ID: '2100654215920021',
  CLIENT_SECRET: 'XZo9vgAxYEmGKD1XiWzv2keT7DT5nOvh'
};

console.log('🔍 Verificando credenciales de MercadoPago...\n');

// Verificar variables de entorno
const currentPublicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
const currentAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

console.log('📋 Estado de las variables de entorno:');
console.log(`   NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY: ${currentPublicKey ? '✅ Configurada' : '❌ No configurada'}`);
console.log(`   MERCADOPAGO_ACCESS_TOKEN: ${currentAccessToken ? '✅ Configurada' : '❌ No configurada'}`);

if (!currentPublicKey || !currentAccessToken) {
  console.log('\n❌ ERROR: Credenciales no configuradas');
  console.log('   Configura las variables de entorno en Firebase Console → App Hosting → Environment Variables');
  process.exit(1);
}

// Verificar que las credenciales coincidan
console.log('\n🔐 Verificando credenciales:');

const publicKeyMatch = currentPublicKey === EXPECTED_CREDENTIALS.PUBLIC_KEY;
const accessTokenMatch = currentAccessToken === EXPECTED_CREDENTIALS.ACCESS_TOKEN;

console.log(`   Public Key: ${publicKeyMatch ? '✅ Correcta' : '❌ Incorrecta'}`);
console.log(`   Access Token: ${accessTokenMatch ? '✅ Correcta' : '❌ Incorrecta'}`);

if (!publicKeyMatch) {
  console.log(`   Esperada: ${EXPECTED_CREDENTIALS.PUBLIC_KEY}`);
  console.log(`   Actual:   ${currentPublicKey}`);
}

if (!accessTokenMatch) {
  console.log(`   Esperada: ${EXPECTED_CREDENTIALS.ACCESS_TOKEN}`);
  console.log(`   Actual:   ${currentAccessToken}`);
}

// Verificar que sean credenciales de producción
console.log('\n🏭 Verificando tipo de credenciales:');

const isProductionPublicKey = !currentPublicKey.startsWith('TEST-');
const isProductionAccessToken = !currentAccessToken.startsWith('TEST-');

console.log(`   Public Key es de producción: ${isProductionPublicKey ? '✅ Sí' : '❌ No (es sandbox)'}`);
console.log(`   Access Token es de producción: ${isProductionAccessToken ? '✅ Sí' : '❌ No (es sandbox)'}`);

// Extraer Client ID del Access Token
const clientIdMatch = currentAccessToken.match(/APP_USR-(\d+)-/);
const extractedClientId = clientIdMatch ? clientIdMatch[1] : null;

console.log('\n🆔 Verificando Client ID:');
console.log(`   Client ID extraído: ${extractedClientId || 'No encontrado'}`);
console.log(`   Client ID esperado: ${EXPECTED_CREDENTIALS.CLIENT_ID}`);
console.log(`   Coincide: ${extractedClientId === EXPECTED_CREDENTIALS.CLIENT_ID ? '✅ Sí' : '❌ No'}`);

// Verificar conectividad con MercadoPago API
console.log('\n🌐 Verificando conectividad con MercadoPago API...');

const testApiCall = () => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      items: [
        {
          title: 'Test Item',
          quantity: 1,
          unit_price: 100,
          currency_id: 'ARS'
        }
      ],
      back_urls: {
        success: 'https://gliter.com.ar/payment/success',
        failure: 'https://gliter.com.ar/payment/failure',
        pending: 'https://gliter.com.ar/payment/pending'
      },
      auto_return: 'approved',
      external_reference: 'test-' + Date.now()
    });

    const options = {
      hostname: 'api.mercadopago.com',
      port: 443,
      path: '/checkout/preferences',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentAccessToken}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({ status: res.statusCode, data: JSON.parse(data) });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
};

testApiCall()
  .then((response) => {
    if (response.status === 201) {
      console.log('   ✅ API de MercadoPago responde correctamente');
      console.log(`   ✅ Preferencia de prueba creada: ${response.data.id}`);
    } else {
      console.log(`   ❌ Error en API de MercadoPago (Status: ${response.status})`);
      console.log(`   Respuesta: ${JSON.stringify(response.data, null, 2)}`);
    }
  })
  .catch((error) => {
    console.log('   ❌ Error de conectividad con MercadoPago API');
    console.log(`   Error: ${error.message}`);
  })
  .finally(() => {
    console.log('\n📊 RESUMEN:');
    
    const allCorrect = publicKeyMatch && accessTokenMatch && isProductionPublicKey && isProductionAccessToken;
    
    if (allCorrect) {
      console.log('   ✅ Todas las credenciales están configuradas correctamente');
      console.log('   ✅ La integración de MercadoPago está lista para producción');
    } else {
      console.log('   ❌ Hay problemas con la configuración de credenciales');
      console.log('   🔧 Revisa y actualiza las credenciales en Firebase Console');
    }
    
    process.exit(allCorrect ? 0 : 1);
  });