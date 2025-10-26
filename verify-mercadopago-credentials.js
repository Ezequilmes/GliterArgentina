#!/usr/bin/env node

/**
 * Script para verificar las credenciales de MercadoPago
 * Verifica si las credenciales están configuradas correctamente para producción
 */

require('dotenv').config({ path: '.env.local' });

// Credenciales de producción esperadas
const EXPECTED_PRODUCTION_ACCESS_TOKEN = 'APP_USR-2100654215920021-090302-fcde5bf150a88e7b9f2223ca0dd2a1e0-93900446';
const EXPECTED_PRODUCTION_PUBLIC_KEY = 'APP_USR-eef5b234-f79b-46ab-aa28-ffd2369f8060';

console.log('🔍 Verificando credenciales de MercadoPago...\n');

// 1. Verificar si las variables de entorno están configuradas
const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
const publicKey = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;

console.log('📋 Estado de las variables de entorno:');
console.log(`MERCADOPAGO_ACCESS_TOKEN: ${accessToken ? '✅ Configurado' : '❌ No configurado'}`);
console.log(`NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY: ${publicKey ? '✅ Configurado' : '❌ No configurado'}\n`);

if (!accessToken || !publicKey) {
  console.log('❌ Error: Las credenciales de MercadoPago no están configuradas');
  process.exit(1);
}

// 2. Verificar si coinciden con las credenciales de producción esperadas
console.log('🔄 Comparando con credenciales de producción esperadas:');
const accessTokenMatch = accessToken === EXPECTED_PRODUCTION_ACCESS_TOKEN;
const publicKeyMatch = publicKey === EXPECTED_PRODUCTION_PUBLIC_KEY;

console.log(`Access Token: ${accessTokenMatch ? '✅ Coincide' : '❌ No coincide'}`);
console.log(`Public Key: ${publicKeyMatch ? '✅ Coincide' : '❌ No coincide'}\n`);

// 3. Verificar si son credenciales de producción (no sandbox)
console.log('🏭 Verificando tipo de credenciales:');
const isProductionAccessToken = accessToken.startsWith('APP_USR-') && !accessToken.includes('TEST');
const isProductionPublicKey = publicKey.startsWith('APP_USR-') && !publicKey.includes('TEST');

console.log(`Access Token es de producción: ${isProductionAccessToken ? '✅ Sí' : '❌ No (sandbox)'}`);
console.log(`Public Key es de producción: ${isProductionPublicKey ? '✅ Sí' : '❌ No (sandbox)'}\n`);

// 4. Extraer y verificar Client ID
console.log('🆔 Información del Client ID:');
try {
  // El Client ID está al final del Access Token después del último guión
  const clientId = accessToken.split('-').pop();
  console.log(`Client ID extraído: ${clientId}`);
  
  // Verificar que el Public Key contiene el mismo Client ID
  const publicKeyClientId = publicKey.split('-').pop();
  const clientIdMatch = clientId === publicKeyClientId;
  console.log(`Client ID coincide entre tokens: ${clientIdMatch ? '✅ Sí' : '❌ No'}\n`);
} catch (error) {
  console.log(`❌ Error extrayendo Client ID: ${error.message}\n`);
}

// 5. Realizar una llamada de prueba a la API de MercadoPago
console.log('🌐 Realizando llamada de prueba a la API de MercadoPago...');

async function testMercadoPagoAPI() {
  try {
    const fetch = (await import('node-fetch')).default;
    
    const testPreference = {
      items: [
        {
          title: 'Test Item - Verificación de Credenciales',
          quantity: 1,
          unit_price: 100,
          currency_id: 'ARS'
        }
      ],
      back_urls: {
        success: 'https://gliter-argentina.web.app/payment/success',
        failure: 'https://gliter-argentina.web.app/payment/failure',
        pending: 'https://gliter-argentina.web.app/payment/pending'
      },
      auto_return: 'approved',
      external_reference: 'test-credentials-verification'
    };

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testPreference)
    });

    const responseData = await response.json();

    if (response.ok) {
      console.log('✅ Llamada a la API exitosa');
      console.log(`Preference ID: ${responseData.id}`);
      console.log(`Sandbox URL: ${responseData.sandbox_init_point || 'N/A'}`);
      console.log(`Production URL: ${responseData.init_point || 'N/A'}`);
    } else {
      console.log('❌ Error en la llamada a la API');
      console.log(`Status: ${response.status}`);
      console.log(`Error: ${JSON.stringify(responseData, null, 2)}`);
    }
  } catch (error) {
    console.log(`❌ Error realizando llamada de prueba: ${error.message}`);
  }
}

// Ejecutar la prueba de API
testMercadoPagoAPI().then(() => {
  console.log('\n📊 Resumen de verificación:');
  
  const allChecks = [
    accessToken && publicKey,
    accessTokenMatch && publicKeyMatch,
    isProductionAccessToken && isProductionPublicKey
  ];
  
  const passedChecks = allChecks.filter(Boolean).length;
  const totalChecks = allChecks.length;
  
  console.log(`Verificaciones pasadas: ${passedChecks}/${totalChecks}`);
  
  if (passedChecks === totalChecks) {
    console.log('🎉 ¡Todas las verificaciones pasaron! Las credenciales están correctamente configuradas.');
  } else {
    console.log('⚠️  Algunas verificaciones fallaron. Revisa la configuración de credenciales.');
  }
  
  console.log('\n💡 Próximos pasos:');
  if (!accessTokenMatch || !publicKeyMatch) {
    console.log('1. Configurar las credenciales de producción en Firebase Console');
    console.log('2. Redesplegar la aplicación en Firebase App Hosting');
  }
  console.log('3. Realizar pruebas de pago en el entorno de producción');
});