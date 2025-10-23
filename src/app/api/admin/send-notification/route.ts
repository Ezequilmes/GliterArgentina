import { NextRequest, NextResponse } from 'next/server';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Inicializar Firebase Admin si no está inicializado
if (!getApps().length) {
  initializeApp({
    credential: cert({
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();
const messaging = getMessaging();

// Función para validar si un token FCM es válido
function isValidFCMToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Los tokens FCM reales tienen características específicas:
  // - Longitud típica entre 140-180 caracteres (incluyendo 152)
  // - Contienen caracteres alfanuméricos, guiones, guiones bajos y dos puntos
  // - Comienzan con patrones específicos de Firebase
  const fcmTokenPattern = /^[A-Za-z0-9_:-]+$/;
  
  if (!fcmTokenPattern.test(token)) {
    return false;
  }
  
  // Verificar longitud mínima y máxima razonable
  if (token.length < 100 || token.length > 200) {
    return false;
  }
  
  // Verificar que contenga el patrón típico de Firebase (starts with device ID:APA91b...)
  if (!token.includes(':APA91b')) {
    return false;
  }
  
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      title, 
      message, 
      targetType, 
      targetUsers, 
      icon, 
      link,
      adminEmail 
    } = body;

    // Verificar que el usuario es administrador
    if (adminEmail !== 'admin@gliter.com.ar') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    // Validar datos requeridos
    if (!title || !message || !targetType) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: title, message, targetType' },
        { status: 400 }
      );
    }

    let tokens: string[] = [];

    // Obtener tokens según el tipo de destinatario
    if (targetType === 'all') {
      // Enviar a todos los usuarios
      const tokensSnapshot = await db.collection('fcm_tokens').get();
      tokensSnapshot.docs.forEach(doc => {
        const userTokens = doc.data().tokens || [];
        // Filtrar solo tokens válidos
        const validTokens = userTokens.filter(isValidFCMToken);
        tokens.push(...validTokens);
      });
    } else if (targetType === 'premium') {
      // Enviar solo a usuarios premium
      const usersSnapshot = await db.collection('users')
        .where('isPremium', '==', true)
        .get();
      
      const premiumUserIds = usersSnapshot.docs.map(doc => doc.id);
      
      for (const userId of premiumUserIds) {
        const tokenDoc = await db.collection('fcm_tokens').doc(userId).get();
        if (tokenDoc.exists) {
          const userTokens = tokenDoc.data()?.tokens || [];
          // Filtrar solo tokens válidos
          const validTokens = userTokens.filter(isValidFCMToken);
          tokens.push(...validTokens);
        }
      }
    } else if (targetType === 'specific' && targetUsers) {
      // Enviar a usuarios específicos
      for (const userId of targetUsers) {
        const tokenDoc = await db.collection('fcm_tokens').doc(userId).get();
        if (tokenDoc.exists) {
          const userTokens = tokenDoc.data()?.tokens || [];
          // Filtrar solo tokens válidos
          const validTokens = userTokens.filter(isValidFCMToken);
          tokens.push(...validTokens);
        }
      }
    }

    // Eliminar tokens duplicados
    tokens = [...new Set(tokens)];

    if (tokens.length === 0) {
      // Verificar si hay usuarios en la base de datos
      const usersSnapshot = await db.collection('users').limit(1).get();
      const hasUsers = !usersSnapshot.empty;
      
      // Verificar si hay tokens en la base de datos (incluyendo falsos)
      const allTokensSnapshot = await db.collection('fcm_tokens').get();
      let totalTokensInDB = 0;
      let invalidTokensFiltered = 0;
      
      allTokensSnapshot.docs.forEach(doc => {
        const userTokens = doc.data().tokens || [];
        totalTokensInDB += userTokens.length;
        const validTokens = userTokens.filter(isValidFCMToken);
        invalidTokensFiltered += (userTokens.length - validTokens.length);
      });
      
      let errorMessage = 'No se encontraron tokens FCM válidos para los destinatarios seleccionados.';
      let suggestions = [];
      
      if (!hasUsers) {
        errorMessage = 'No hay usuarios registrados en la aplicación.';
        suggestions.push('Los usuarios deben registrarse en la aplicación primero');
      } else if (invalidTokensFiltered > 0) {
        errorMessage = `Se filtraron ${invalidTokensFiltered} tokens FCM inválidos. No hay tokens válidos disponibles.`;
        suggestions.push('Los usuarios deben obtener tokens FCM reales desde /test-fcm');
        suggestions.push('Verificar que los tokens tengan el formato correcto (deviceId:APA91b...)');
        suggestions.push('Los usuarios deben permitir notificaciones en su navegador');
      } else {
        errorMessage = 'No se encontraron tokens FCM válidos. Los tokens se generan automáticamente al autenticarse.';
        suggestions.push('Los usuarios deben autenticarse en la aplicación (los tokens se generan automáticamente)');
        suggestions.push('Los usuarios deben permitir notificaciones cuando el navegador lo solicite');
        suggestions.push('Verificar que el Service Worker esté funcionando correctamente');
        suggestions.push('Si los tokens no se generan automáticamente, usar /test-fcm para obtener tokens manualmente');
        suggestions.push('Los usuarios pueden necesitar reautenticarse para generar nuevos tokens');
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          suggestions,
          debug: {
            hasUsers,
            validTokensFound: tokens.length,
            totalTokensInDB,
            invalidTokensFiltered,
            targetType
          }
        },
        { status: 400 }
      );
    }

    // Preparar el payload de la notificación
    const notificationPayload = {
      notification: {
        title,
        body: message,
        icon: icon || '/logo.svg',
      },
      data: {
        type: 'admin_notification',
        timestamp: Date.now().toString(),
        ...(link && { link })
      },
      tokens,
      webpush: {
        notification: {
          title,
          body: message,
          icon: icon || '/logo.svg',
          badge: '/logo.svg',
          vibrate: [200, 100, 200],
          requireInteraction: true,
          tag: 'admin_notification',
        },
        ...(link && {
          fcm_options: {
            link
          }
        })
      },
    };

    // Enviar la notificación
    const response = await messaging.sendEachForMulticast(notificationPayload);

    // Manejar tokens fallidos
    const failedTokens: string[] = [];
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
          console.error(`Failed to send to token ${tokens[idx]}:`, resp.error);
        }
      });
    }

    // Guardar registro de la notificación enviada
    await db.collection('admin_notifications').add({
      title,
      message,
      targetType,
      targetUsers: targetUsers || null,
      icon: icon || '/logo.svg',
      link: link || null,
      sentBy: adminEmail,
      sentAt: new Date(),
      totalTokens: tokens.length,
      successCount: response.successCount,
      failureCount: response.failureCount,
      failedTokens
    });

    return NextResponse.json({
      success: true,
      message: 'Notificación enviada exitosamente',
      stats: {
        totalTokens: tokens.length,
        successCount: response.successCount,
        failureCount: response.failureCount
      }
    });

  } catch (error) {
    console.error('Error sending admin notification:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}