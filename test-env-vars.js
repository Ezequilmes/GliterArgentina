#!/usr/bin/env node

/**
 * Script para probar las variables de entorno de MercadoPago en producción
 * Ejecuta una llamada al endpoint de debug para verificar que las variables estén disponibles
 */

const https = require('https');

const PRODUCTION_URL = 'https://gliter.com.ar';
const DEBUG_ENDPOINT = '/api/debug/env';

console.log('🔍 Verificando variables de entorno en producción...\n');

const options = {
  hostname: 'gliter.com.ar',
  port: 443,
  path: DEBUG_ENDPOINT,
  method: 'GET',
  headers: {
    'User-Agent': 'Gliter-Debug-Script/1.0'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      console.log('📊 Estado de las variables de entorno:');
      console.log('=====================================\n');
      
      const env = response.environment;
      
      // Variables críticas de MercadoPago
      const criticalVars = [
        'MERCADOPAGO_ACCESS_TOKEN',
        'NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY',
        'MERCADOPAGO_CLIENT_ID',
        'MERCADOPAGO_CLIENT_SECRET'
      ];
      
      criticalVars.forEach(varName => {
        const status = env[varName];
        const icon = status === 'undefined' ? '❌' : '✅';
        console.log(`${icon} ${varName}: ${status}`);
      });
      
      console.log('\n📋 Otras variables:');
      console.log('==================');
      Object.keys(env).forEach(key => {
        if (!criticalVars.includes(key)) {
          console.log(`   ${key}: ${env[key]}`);
        }
      });
      
      console.log('\n🔑 Todas las variables disponibles:');
      console.log('===================================');
      response.allEnvKeys.forEach(key => {
        console.log(`   ${key}`);
      });
      
      // Verificar si todas las variables críticas están configuradas
      const missingVars = criticalVars.filter(varName => env[varName] === 'undefined');
      
      if (missingVars.length === 0) {
        console.log('\n✅ Todas las variables críticas de MercadoPago están configuradas');
      } else {
        console.log('\n❌ Variables faltantes:');
        missingVars.forEach(varName => {
          console.log(`   - ${varName}`);
        });
      }
      
      console.log(`\n⏰ Timestamp: ${response.timestamp}`);
      
    } catch (error) {
      console.error('❌ Error al parsear la respuesta:', error);
      console.log('Respuesta raw:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error al conectar con el servidor:', error.message);
  
  if (error.code === 'ENOTFOUND') {
    console.log('💡 Posibles causas:');
    console.log('   - El dominio no está resolviendo correctamente');
    console.log('   - El despliegue aún no se ha completado');
    console.log('   - Problemas de conectividad');
  }
});

req.end();