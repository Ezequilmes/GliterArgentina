#!/usr/bin/env node

/**
 * Script para obtener token FCM desde la consola del navegador
 * Este script proporciona instrucciones para obtener el token manualmente
 */

const fs = require('fs');

console.log('🎯 Cómo obtener un token FCM real para pruebas:\n');

console.log('1. 📱 Abre tu navegador y ve a: http://localhost:3001/test-fcm');
console.log('2. 🔐 Inicia sesión con un usuario real (puedes crear uno en /auth/register)');
console.log('3. 📋 Cuando aparezca el botón "Solicitar Permisos", haz clic en él');
console.log('4. ✅ Acepta los permisos de notificación cuando el navegador lo solicite');
console.log('5. 📄 El token FCM aparecerá en la página');
console.log('');
console.log('💡 Alternativa: Puedes abrir la consola del navegador (F12) y ejecutar:');
console.log('   await firebase.messaging().getToken({ vapidKey: "YOUR_VAPID_KEY" })');
console.log('');

// Si ya tenemos un token guardado, mostrarlo
if (fs.existsSync('real-fcm-token.json')) {
  try {
    const tokenData = JSON.parse(fs.readFileSync('real-fcm-token.json', 'utf8'));
    console.log('📝 Token FCM guardado anteriormente:');
    console.log(`   ${tokenData.token}`);
    console.log(`   Guardado el: ${tokenData.timestamp}`);
    console.log('');
    console.log('¿Quieres usar este token? (s/n)');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl.question('', (answer) => {
      rl.close();
      if (answer.toLowerCase() === 's' || answer.toLowerCase() === 'si') {
        console.log('✅ Usando token guardado');
        // Aquí podrías continuar con el proceso de prueba
      } else {
        console.log('🔄 Por favor obtén un nuevo token desde la página');
      }
    });
    
  } catch (error) {
    console.log('⚠️ No se pudo leer el token guardado');
  }
} else {
  console.log('🆕 No hay tokens guardados. Por favor obtén uno desde la página.');
}

console.log('\n📋 Una vez que tengas el token, puedes:');
console.log('   1. Copiarlo y pegarlo cuando el script lo solicite');
console.log('   2. Guardarlo en un archivo real-fcm-token.json');
console.log('   3. Usar el endpoint /api/test/send-notification directamente');

// Crear un archivo de ejemplo
const exampleTokenData = {
  "example": "Copia tu token FCM aquí",
  "format": "El token debe tener aproximadamente 152 caracteres",
  "instructions": "Obtén el token desde http://localhost:3001/test-fcm"
};

fs.writeFileSync('fcm-token-example.json', JSON.stringify(exampleTokenData, null, 2));
console.log('\n💾 Archivo de ejemplo creado: fcm-token-example.json');