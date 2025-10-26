#!/usr/bin/env node

/**
 * Script para configurar variables de entorno en Firebase App Hosting
 * Este script configura tanto las credenciales de MercadoPago como las de Firebase Admin SDK
 */

const { execSync } = require('child_process');

// Credenciales de MercadoPago (proporcionadas por el usuario)
const MERCADOPAGO_CREDENTIALS = {
  PUBLIC_KEY: 'APP_USR-7c5a0b8e-b8b5-4b8e-8b8e-8b8e8b8e8b8e',
  ACCESS_TOKEN: 'APP_USR-1234567890123456-123456-abcdef1234567890abcdef1234567890-123456789',
  CLIENT_ID: '1234567890123456',
  CLIENT_SECRET: 'abcdef1234567890abcdef1234567890'
};

// Información del proyecto Firebase
const PROJECT_ID = 'gliter-argentina';
const BACKEND_ID = 'my-web-app';
const LOCATION = 'us-central1';

console.log('🔧 Configurando variables de entorno para Firebase App Hosting...');
console.log(`📍 Proyecto: ${PROJECT_ID}`);
console.log(`🖥️  Backend: ${BACKEND_ID}`);
console.log(`🌍 Región: ${LOCATION}`);

// Función para ejecutar comandos de Firebase
function runFirebaseCommand(command) {
  try {
    console.log(`\n⚡ Ejecutando: ${command}`);
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log('✅ Éxito');
    return result;
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    if (error.stdout) console.log('STDOUT:', error.stdout);
    if (error.stderr) console.log('STDERR:', error.stderr);
    throw error;
  }
}

// Configurar variables de entorno
async function configureEnvironmentVariables() {
  console.log('\n🔐 Configurando credenciales de MercadoPago...');
  
  // MercadoPago Public Key
  runFirebaseCommand(`firebase apphosting:secrets:set NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY --project ${PROJECT_ID} --backend ${BACKEND_ID} --location ${LOCATION} --data-file -`);
  
  // MercadoPago Access Token
  runFirebaseCommand(`firebase apphosting:secrets:set MERCADOPAGO_ACCESS_TOKEN --project ${PROJECT_ID} --backend ${BACKEND_ID} --location ${LOCATION} --data-file -`);
  
  console.log('\n🔥 Configurando credenciales de Firebase Admin SDK...');
  
  // Firebase Project ID
  runFirebaseCommand(`firebase apphosting:secrets:set FIREBASE_PROJECT_ID --project ${PROJECT_ID} --backend ${BACKEND_ID} --location ${LOCATION} --data-file -`);
  
  console.log('\n✅ Configuración completada!');
  console.log('\n📋 Próximos pasos:');
  console.log('1. Verificar que todas las variables estén configuradas');
  console.log('2. Redesplegar la aplicación');
  console.log('3. Validar el funcionamiento del sistema de pagos');
}

// Ejecutar configuración
if (require.main === module) {
  configureEnvironmentVariables().catch(console.error);
}

module.exports = { configureEnvironmentVariables };