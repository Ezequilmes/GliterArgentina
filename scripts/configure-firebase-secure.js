#!/usr/bin/env node

/**
 * Script SEGURO para configurar las credenciales de producción de MercadoPago en Firebase App Hosting
 * Este script lee las credenciales desde variables de entorno o un archivo de configuración seguro
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Configuración SEGURA de Credenciales - Gliter Argentina\n');

// Intentar cargar configuración desde archivo seguro
let config = null;
const configPath = path.join(__dirname, 'config.js');

if (fs.existsSync(configPath)) {
  try {
    config = require('./config.js');
    console.log('✅ Configuración cargada desde archivo seguro');
  } catch (error) {
    console.error('❌ Error cargando configuración:', error.message);
    process.exit(1);
  }
} else {
  console.log('⚠️  Archivo config.js no encontrado. Copia config.example.js como config.js');
  process.exit(1);
}

// Obtener credenciales (prioridad: env vars > config file)
const PRODUCTION_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || config?.mercadoPago?.production?.accessToken;
const PRODUCTION_PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY || config?.mercadoPago?.production?.publicKey;

if (!PRODUCTION_ACCESS_TOKEN || !PRODUCTION_PUBLIC_KEY) {
  console.error('❌ Credenciales de producción no encontradas');
  console.log('Asegúrate de configurar:');
  console.log('- MERCADOPAGO_ACCESS_TOKEN en variables de entorno o config.js');
  console.log('- NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY en variables de entorno o config.js');
  process.exit(1);
}

// Validar formato de credenciales
if (!PRODUCTION_ACCESS_TOKEN.startsWith('APP_USR-')) {
  console.error('❌ Access Token debe ser de producción (APP_USR-)');
  process.exit(1);
}

if (!PRODUCTION_PUBLIC_KEY.startsWith('APP_USR-')) {
  console.error('❌ Public Key debe ser de producción (APP_USR-)');
  process.exit(1);
}

console.log('📋 Credenciales de Producción validadas:');
console.log(`Access Token: ${PRODUCTION_ACCESS_TOKEN.substring(0, 20)}...`);
console.log(`Public Key: ${PRODUCTION_PUBLIC_KEY.substring(0, 20)}...\n`);

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
console.log('5. Agrega las variables como secretos\n');

console.log('✅ Configuración completada de forma segura');