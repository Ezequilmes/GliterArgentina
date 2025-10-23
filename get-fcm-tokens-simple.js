#!/usr/bin/env node

/**
 * Script simple para obtener tokens FCM de Firestore
 * Este script accede directamente a Firestore sin autenticación completa
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getMessaging } = require('firebase-admin/messaging');

// Inicializar Firebase Admin con credenciales de servicio
const serviceAccount = require('./gliter-argentina-firebase-adminsdk.json');

initializeApp({
  credential: cert(serviceAccount),
  databaseURL: 'https://gliter-argentina.firebaseio.com'
});

const db = getFirestore();
const messaging = getMessaging();

async function getFCMTokens() {
  try {
    console.log('🔍 Buscando tokens FCM en Firestore...');
    
    // Buscar en la colección users
    const usersSnapshot = await db.collection('users').limit(10).get();
    console.log(`📊 Encontrados ${usersSnapshot.size} usuarios`);
    
    const tokens = [];
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      console.log(`\n👤 Usuario: ${userData.displayName || 'Sin nombre'} (${userId})`);
      
      // Buscar tokens FCM en la subcolección
      const tokensSnapshot = await db.collection('users').doc(userId).collection('fcmTokens').get();
      
      if (!tokensSnapshot.empty) {
        console.log(`   📱 Encontrados ${tokensSnapshot.size} tokens FCM:`);
        
        for (const tokenDoc of tokensSnapshot.docs) {
          const tokenData = tokenDoc.data();
          const token = tokenData.token;
          
          console.log(`   🔑 Token: ${token.substring(0, 20)}...`);
          console.log(`   📅 Creado: ${tokenData.createdAt?.toDate() || 'Fecha desconocida'}`);
          console.log(`   🏷️  Tipo: ${tokenData.deviceType || 'Desconocido'}`);
          
          if (token) {
            tokens.push({
              token: token,
              userId: userId,
              userName: userData.displayName || 'Sin nombre',
              createdAt: tokenData.createdAt?.toDate(),
              deviceType: tokenData.deviceType || 'unknown'
            });
          }
        }
      } else {
        console.log(`   ❌ Sin tokens FCM`);
      }
    }
    
    console.log(`\n✅ Total de tokens FCM encontrados: ${tokens.length}`);
    
    if (tokens.length > 0) {
      console.log('\n📝 Tokens disponibles para pruebas:');
      tokens.forEach((tokenInfo, index) => {
        console.log(`${index + 1}. ${tokenInfo.token}`);
        console.log(`   Usuario: ${tokenInfo.userName} (${tokenInfo.userId})`);
        console.log(`   Dispositivo: ${tokenInfo.deviceType}`);
        console.log('');
      });
      
      // Guardar tokens en un archivo para uso posterior
      const fs = require('fs');
      const tokensData = {
        tokens: tokens,
        timestamp: new Date().toISOString(),
        count: tokens.length
      };
      
      fs.writeFileSync('fcm-tokens.json', JSON.stringify(tokensData, null, 2));
      console.log('💾 Tokens guardados en fcm-tokens.json');
      
      // Probar el primer token
      if (tokens.length > 0) {
        console.log('\n🧪 Probando notificación con el primer token...');
        await testNotification(tokens[0].token);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.code === 'auth/argument-error') {
      console.log('\n💡 Sugerencia: Asegúrate de que el archivo gliter-argentina-firebase-adminsdk.json existe');
      console.log('   Debes descargar las credenciales de servicio desde Firebase Console > Configuración > Cuentas de servicio');
    }
  }
}

async function testNotification(token) {
  try {
    const message = {
      token: token,
      notification: {
        title: 'Prueba de Notificación',
        body: 'Esta es una notificación de prueba desde el script'
      },
      data: {
        type: 'test',
        timestamp: Date.now().toString()
      },
      webpush: {
        notification: {
          icon: '/icon-192x192.png',
          badge: '/icon-144x144.png',
          vibrate: [200, 100, 200],
          requireInteraction: true,
          tag: 'test-notification'
        }
      }
    };
    
    const response = await messaging.send(message);
    console.log(`✅ Notificación enviada exitosamente: ${response}`);
    
  } catch (error) {
    console.error('❌ Error enviando notificación:', error.message);
    
    if (error.errorInfo) {
      console.log('   Código:', error.errorInfo.code);
      console.log('   Detalles:', error.errorInfo.message);
    }
  }
}

// Ejecutar el script
getFCMTokens();