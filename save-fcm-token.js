const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('💾 Guardador de Token FCM Real');
console.log('================================');
console.log('');

// Preguntar por el token
rl.question('📋 Por favor, pega el token FCM real: ', (token) => {
  if (!token || token.trim().length === 0) {
    console.log('❌ Token no válido');
    rl.close();
    return;
  }

  rl.question('👤 ID del usuario (opcional, default: test-user-123): ', (userId) => {
    const finalUserId = userId.trim() || 'test-user-123';
    
    // Generar nombre de archivo con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `fcm-token-${finalUserId}-${timestamp}.json`;
    
    // Crear el objeto de datos
    const tokenData = {
      token: token.trim(),
      userId: finalUserId,
      timestamp: new Date().toISOString(),
      source: 'manual-input'
    };
    
    // Guardar el archivo
    try {
      fs.writeFileSync(path.join(__dirname, filename), JSON.stringify(tokenData, null, 2));
      console.log('');
      console.log('✅ Token guardado exitosamente!');
      console.log(`📁 Archivo: ${filename}`);
      console.log(`👤 Usuario: ${finalUserId}`);
      console.log(`📅 Fecha: ${tokenData.timestamp}`);
      console.log('');
      console.log('💡 Ahora puedes ejecutar: node test-notification-endpoint.js');
      console.log('   para probar las notificaciones con este token real.');
    } catch (error) {
      console.log('❌ Error guardando el token:', error.message);
    }
    
    rl.close();
  });
});