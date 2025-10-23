#!/usr/bin/env node

/**
 * Script simplificado para probar el endpoint de administración
 * Este script no requiere credenciales de Firebase Admin
 */

async function testAdminNotification() {
  console.log('🚀 Probando endpoint de administración...\n');
  
  try {
    // Datos de prueba
    const testData = {
      title: 'Notificación de Prueba',
      message: 'Este es un mensaje de prueba desde el panel de administración',
      targetType: 'all', // 'all', 'premium', o 'specific'
      adminEmail: 'admin@gliter.com.ar',
      icon: '/logo.svg',
      link: 'https://gliter.com.ar'
    };

    console.log('📤 Enviando datos:');
    console.log(JSON.stringify(testData, null, 2));
    console.log('\n🔄 Realizando petición a /api/admin/send-notification...');

    const response = await fetch('http://localhost:3000/api/admin/send-notification', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log(`\n📊 Código de respuesta: ${response.status}`);
    console.log('📨 Respuesta del servidor:');
    console.log(JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('\n✅ Notificación enviada exitosamente');
      if (result.successCount !== undefined) {
        console.log(`📱 Tokens procesados: ${result.successCount + result.failureCount}`);
        console.log(`✅ Éxitos: ${result.successCount}`);
        console.log(`❌ Fallos: ${result.failureCount}`);
      }
    } else {
      console.log('\n❌ Error al enviar notificación');
      if (result.suggestions && result.suggestions.length > 0) {
        console.log('\n💡 Sugerencias:');
        result.suggestions.forEach((suggestion, index) => {
          console.log(`   ${index + 1}. ${suggestion}`);
        });
      }
    }

  } catch (error) {
    console.error('\n💥 Error en la petición:', error.message);
    console.log('\n🔧 Verifica que:');
    console.log('   - El servidor esté ejecutándose (npm run dev)');
    console.log('   - La URL del endpoint sea correcta');
    console.log('   - No haya problemas de red');
  }
}

// Ejecutar la prueba
console.log('🎯 Test de Notificaciones de Administración');
console.log('==============================================\n');

testAdminNotification().then(() => {
  console.log('\n✅ Test completado');
}).catch((error) => {
  console.error('\n❌ Error en el test:', error);
});