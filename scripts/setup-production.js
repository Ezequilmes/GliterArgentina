#!/usr/bin/env node

/**
 * Script de configuración para despliegue en producción
 * Configura automáticamente el sistema de In-App Messaging
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Pregunta por consola y devuelve la respuesta del usuario.
 * @param {string} query - Texto de la pregunta a mostrar.
 * @returns {Promise<string>} Respuesta ingresada por el usuario.
 */
function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

/**
 * Configura variables y scripts necesarios para despliegue en producción.
 * - Verifica archivos requeridos.
 * - Solicita variables de entorno clave.
 * - Genera `.env.production` y script de verificación.
 * @returns {Promise<void>} Promesa que se resuelve al finalizar la configuración.
 */
async function setupProduction() {
  console.log('🚀 Configuración de In-App Messaging para Producción\n');

  try {
    // Verificar archivos necesarios
    console.log('📋 Verificando archivos necesarios...');
    
    const requiredFiles = [
      'src/services/inAppMessagingService.ts',
      'src/hooks/useInAppMessaging.ts',
      'src/components/notifications/InAppMessageHandler.tsx',
      'src/app/api/in-app-messages/config/route.ts',
      'src/app/api/in-app-messages/messages/route.ts'
    ];

    for (const file of requiredFiles) {
      if (!fs.existsSync(file)) {
        console.error(`❌ Archivo requerido no encontrado: ${file}`);
        process.exit(1);
      }
    }
    console.log('✅ Todos los archivos necesarios están presentes\n');

    // Configurar variables de entorno
    console.log('🔧 Configuración de variables de entorno...');
    
    const envConfig = {};
    
    // Firebase Configuration
    console.log('\n📱 Configuración de Firebase:');
    envConfig.NEXT_PUBLIC_FIREBASE_API_KEY = await question('Firebase API Key: ');
    envConfig.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = await question('Firebase Auth Domain: ');
    envConfig.NEXT_PUBLIC_FIREBASE_PROJECT_ID = await question('Firebase Project ID: ');
    envConfig.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = await question('Firebase Messaging Sender ID: ');
    envConfig.NEXT_PUBLIC_FIREBASE_APP_ID = await question('Firebase App ID: ');
    envConfig.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID = await question('Firebase Measurement ID (opcional): ');

    // App Configuration
    console.log('\n🌐 Configuración de la aplicación:');
    envConfig.NEXT_PUBLIC_APP_URL = (await question('URL de la aplicación (default: https://gliter.com.ar): ')) || 'https://gliter.com.ar';
    envConfig.NEXT_PUBLIC_USE_FIREBASE_EMULATOR = 'false';

    // Mercado Pago (cliente)
    console.log('\n💳 Configuración de Mercado Pago (cliente):');
    const mpPublicKey = await question('MercadoPago Public Key (NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY): ');
    if (mpPublicKey) {
      envConfig.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY = mpPublicKey;
    }

    // Web Push (VAPID)
    console.log('\n🔔 Configuración de Web Push (opcional):');
    const vapidPublicKey = await question('VAPID Public Key (NEXT_PUBLIC_VAPID_PUBLIC_KEY - opcional): ');
    if (vapidPublicKey) {
      envConfig.NEXT_PUBLIC_VAPID_PUBLIC_KEY = vapidPublicKey;
    }

    // In-App Messaging Configuration
    console.log('\n💬 Configuración de In-App Messaging:');
    envConfig.INAPP_MESSAGING_ENABLED = 'true';
    
    const maxMessages = await question('Máximo mensajes por sesión (default: 3): ');
    envConfig.INAPP_MAX_MESSAGES_PER_SESSION = maxMessages || '3';
    
    const displayInterval = await question('Intervalo entre mensajes en ms (default: 30000): ');
    envConfig.INAPP_DISPLAY_INTERVAL = displayInterval || '30000';

    // Google Analytics
    console.log('\n📊 Configuración de Analytics:');
    const ga4Secret = await question('GA4 API Secret (opcional): ');
    if (ga4Secret) {
      envConfig.GA4_API_SECRET = ga4Secret;
    }

    // Crear archivo .env.production
    const envContent = Object.entries(envConfig)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    fs.writeFileSync('.env.production', envContent);
    console.log('\n✅ Archivo .env.production creado');

    // Verificar configuración de build
    console.log('\n🔨 Verificando configuración de build...');
    
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (!packageJson.scripts.build) {
      console.error('❌ Script de build no encontrado en package.json');
      process.exit(1);
    }

    console.log('✅ Configuración de build verificada');

    // Crear script de verificación post-despliegue
    const verificationScript = `
#!/usr/bin/env node

/**
 * Script de verificación post-despliegue
 */

import https from 'https';

/**
 * Verifica que los endpoints críticos respondan con 200.
 * @param {string} baseUrl - URL base del despliegue (ej: https://miapp.com).
 * @returns {Promise<void>} Promesa que se resuelve al finalizar las verificaciones.
 */
async function verifyEndpoints(baseUrl) {
  const endpoints = [
    '/api/in-app-messages/config',
    '/api/in-app-messages/messages'
  ];

  console.log('🔍 Verificando endpoints...');

  for (const endpoint of endpoints) {
    try {
      const url = baseUrl + endpoint;
      console.log(\`Verificando: \${url}\`);
      
      await new Promise((resolve, reject) => {
        https.get(url, (res) => {
          if (res.statusCode === 200) {
            console.log(\`✅ \${endpoint} - OK\`);
          } else {
            console.log(\`⚠️  \${endpoint} - Status: \${res.statusCode}\`);
          }
          resolve();
        }).on('error', (err) => {
          console.log(\`❌ \${endpoint} - Error: \${err.message}\`);
          resolve();
        });
      });
    } catch (error) {
      console.log(\`❌ \${endpoint} - Error: \${error.message}\`);
    }
  }
}

/**
 * Punto de entrada del script de verificación.
 * Lee la URL base desde argumentos y ejecuta verificaciones.
 * @returns {Promise<void>} Promesa que se resuelve al finalizar.
 */
async function main() {
  const baseUrl = process.argv[2];
  
  if (!baseUrl) {
    console.error('Uso: node verify-deployment.js <URL_BASE>');
    console.error('Ejemplo: node verify-deployment.js https://miapp.com');
    process.exit(1);
  }

  await verifyEndpoints(baseUrl);
  console.log('\\n🎉 Verificación completada');
}

main().catch(console.error);
`;

    fs.writeFileSync('scripts/verify-deployment.js', verificationScript);
    fs.chmodSync('scripts/verify-deployment.js', '755');
    console.log('✅ Script de verificación creado: scripts/verify-deployment.js');

    // Mostrar resumen
    console.log('\n📋 Resumen de configuración:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🌐 URL de la aplicación: ${envConfig.NEXT_PUBLIC_APP_URL}`);
    console.log(`📱 Firebase Project ID: ${envConfig.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
    console.log(`💬 Mensajes por sesión: ${envConfig.INAPP_MAX_MESSAGES_PER_SESSION}`);
    console.log(`⏱️  Intervalo de display: ${envConfig.INAPP_DISPLAY_INTERVAL}ms`);
    console.log(`📊 Analytics configurado: ${envConfig.GA4_API_SECRET ? 'Sí' : 'No'}`);

    console.log('\n🚀 Próximos pasos:');
    console.log('1. Revisar el archivo .env.production generado');
    console.log('2. Ejecutar: npm run build');
    console.log('3. Desplegar a tu plataforma de hosting');
    console.log('4. Ejecutar: node scripts/verify-deployment.js <URL_DE_TU_APP>');
    console.log('5. Revisar la documentación en docs/IN_APP_MESSAGING_PRODUCTION.md');

    console.log('\n✨ ¡Configuración completada exitosamente!');

  } catch (error) {
    console.error('❌ Error durante la configuración:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Verificar si estamos en el directorio correcto
if (!fs.existsSync('package.json')) {
  console.error('❌ Este script debe ejecutarse desde la raíz del proyecto');
  process.exit(1);
}

// Crear directorio scripts si no existe
if (!fs.existsSync('scripts')) {
  fs.mkdirSync('scripts');
}

// Crear directorio docs si no existe
if (!fs.existsSync('docs')) {
  fs.mkdirSync('docs');
}

setupProduction().catch(console.error);
