#!/usr/bin/env node

/**
 * Script para configurar las credenciales de producción de MercadoPago en Firebase App Hosting
 * Este script genera los comandos necesarios para configurar las variables de entorno
 */

console.log('🔧 Configuración de Credenciales de Producción - Gliter Argentina\n');

// Credenciales de producción proporcionadas
const PRODUCTION_ACCESS_TOKEN = 'APP_USR-2100654215920021-090302-fcde5bf150a88e7b9f2223ca0dd2a1e0-93900446';
const PRODUCTION_PUBLIC_KEY = 'APP_USR-eef5b234-f79b-46ab-aa28-ffd2369f8060';

console.log('📋 Credenciales de Producción a Configurar:');
console.log(`Access Token: ${PRODUCTION_ACCESS_TOKEN}`);
console.log(`Public Key: ${PRODUCTION_PUBLIC_KEY}\n`);

console.log('🚀 Comandos para configurar en Firebase Console:\n');

console.log('1️⃣ Configurar Access Token:');
console.log(`firebase apphosting:secrets:set MERCADOPAGO_ACCESS_TOKEN="${PRODUCTION_ACCESS_TOKEN}" --project gliter-argentina\n`);

console.log('2️⃣ Configurar Public Key:');
console.log(`firebase apphosting:secrets:set NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY="${PRODUCTION_PUBLIC_KEY}" --project gliter-argentina\n`);

console.log('📝 Alternativamente, puedes configurar manualmente en Firebase Console:');
console.log('1. Ve a https://console.firebase.google.com/project/gliter-argentina');
console.log('2. Navega a App Hosting > Backends');
console.log('3. Selecciona tu backend');
console.log('4. Ve a la pestaña "Environment variables"');
console.log('5. Agrega/actualiza las siguientes variables:\n');

console.log('   Variable: MERCADOPAGO_ACCESS_TOKEN');
console.log(`   Valor: ${PRODUCTION_ACCESS_TOKEN}\n`);

console.log('   Variable: NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY');
console.log(`   Valor: ${PRODUCTION_PUBLIC_KEY}\n`);

console.log('🔄 Después de configurar las variables:');
console.log('1. Redesplegar la aplicación');
console.log('2. Ejecutar: node verify-mercadopago-credentials.js');
console.log('3. Realizar pruebas de pago en producción\n');

console.log('⚠️  IMPORTANTE:');
console.log('- Estas son credenciales de PRODUCCIÓN');
console.log('- Los pagos serán reales y se procesarán dinero real');
console.log('- Asegúrate de probar primero en sandbox antes de usar en producción');
console.log('- Mantén estas credenciales seguras y no las compartas\n');

// Verificar si Firebase CLI está instalado
console.log('🔍 Verificando Firebase CLI...');

const { exec } = require('child_process');

exec('firebase --version', (error, stdout, stderr) => {
  if (error) {
    console.log('❌ Firebase CLI no está instalado o no está en el PATH');
    console.log('💡 Instala Firebase CLI: npm install -g firebase-tools');
    console.log('💡 Luego ejecuta: firebase login');
  } else {
    console.log(`✅ Firebase CLI instalado: ${stdout.trim()}`);
    
    // Verificar si está autenticado
    exec('firebase projects:list', (authError, authStdout, authStderr) => {
      if (authError) {
        console.log('❌ No estás autenticado en Firebase');
        console.log('💡 Ejecuta: firebase login');
      } else {
        console.log('✅ Autenticado en Firebase');
        console.log('\n🎯 Puedes ejecutar los comandos de configuración ahora!');
      }
    });
  }
});

console.log('\n📚 Documentación adicional:');
console.log('- Firebase App Hosting: https://firebase.google.com/docs/app-hosting');
console.log('- MercadoPago Credentials: https://www.mercadopago.com.ar/developers/panel');
console.log('- Gliter Argentina Setup: ./MERCADOPAGO_PRODUCTION_SETUP.md');