const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'gliter-argentina'
  });
}

const db = admin.firestore();
const messaging = admin.messaging();

async function testPushNotification() {
  try {
    console.log('🔍 Buscando tokens FCM de usuarios...');
    
    // Get FCM tokens from users
    const usersSnapshot = await db.collection('users').limit(5).get();
    const tokens = [];
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      if (userData.fcmTokens && Array.isArray(userData.fcmTokens)) {
        tokens.push(...userData.fcmTokens);
      }
    });
    
    if (tokens.length === 0) {
      console.log('❌ No se encontraron tokens FCM');
      return;
    }
    
    console.log(`📱 Encontrados ${tokens.length} tokens FCM`);
    
    // Test notification payload
    const notificationPayload = {
      notification: {
        title: '🧪 Prueba de Notificación',
        body: 'Esta es una prueba de notificación push con sonido',
      },
      data: {
        type: 'test',
        timestamp: Date.now().toString(),
      },
      tokens: tokens.slice(0, 3), // Only test with first 3 tokens
      webpush: {
        headers: {
          Urgency: 'high',
        },
        notification: {
          title: '🧪 Prueba de Notificación',
          body: 'Esta es una prueba de notificación push con sonido',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-144x144.png',
          vibrate: [200, 100, 200],
          requireInteraction: true,
          silent: false,
          tag: 'test',
          actions: [
            {
              action: 'open',
              title: '👀 Abrir app',
            },
            {
              action: 'close',
              title: '❌ Cerrar',
            },
          ],
        },
        fcm_options: {
          link: '/',
        },
      },
    };
    
    console.log('📤 Enviando notificación de prueba...');
    
    // Send the notification
    const response = await messaging.sendEachForMulticast(notificationPayload);
    
    console.log('✅ Respuesta del envío:', {
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
    
    if (response.responses) {
      response.responses.forEach((resp, idx) => {
        if (resp.success) {
          console.log(`✅ Token ${idx + 1}: Enviado exitosamente`);
        } else {
          console.log(`❌ Token ${idx + 1}: Error -`, resp.error?.message);
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error enviando notificación de prueba:', error);
  }
}

// Run the test
testPushNotification()
  .then(() => {
    console.log('🏁 Prueba completada');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error en la prueba:', error);
    process.exit(1);
  });