import { NextRequest, NextResponse } from 'next/server';
import { getMessaging } from 'firebase-admin/messaging';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

export const dynamic = 'force-dynamic';
export const revalidate = false;

function ensureAdminInitialized() {
  if (getApps().length) return;

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\n/g, '\n');

  try {
    if (projectId && clientEmail && privateKey) {
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        projectId,
      });
    } else {
      console.warn('⚠️ Credenciales Firebase Admin incompletas (send-notification).');
    }
  } catch (err) {
    console.warn('⚠️ Firebase Admin no pudo inicializarse (send-notification):', err);
  }
}

// Función para validar si un token FCM es válido
function isValidFCMToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }
  const fcmTokenPattern = /^[A-Za-z0-9_:-]+$/;
  if (!fcmTokenPattern.test(token)) {
    return false;
  }
  if (token.length < 100 || token.length > 200) {
    return false;
  }
  if (!token.includes(':APA91b')) {
    return false;
  }
  return true;
}

export async function POST(request: NextRequest) {
  try {
    ensureAdminInitialized();
    if (!getApps().length) {
      return NextResponse.json(
        { error: 'Firebase Admin no configurado. Verifica FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY.' },
        { status: 500 }
      );
    }

    const db = getFirestore();
    const messaging = getMessaging();

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

    if (adminEmail !== 'admin@gliter.com.ar') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 403 }
      );
    }

    if (!title || !message || !targetType) {
      return NextResponse.json(
        { error: 'Faltan datos requeridos: title, message, targetType' },
        { status: 400 }
      );
    }

    let tokens: string[] = [];

    if (targetType === 'all') {
      const tokensSnapshot = await db.collection('fcm_tokens').get();
      tokensSnapshot.docs.forEach(doc => {
        const userTokens = doc.data().tokens || [];
        const validTokens = userTokens.filter(isValidFCMToken);
        tokens.push(...validTokens);
      });
    } else if (targetType === 'premium') {
      const usersSnapshot = await db.collection('users')
        .where('isPremium', '==', true)
        .get();
      const premiumUserIds = usersSnapshot.docs.map(doc => doc.id);
      for (const userId of premiumUserIds) {
        const tokenDoc = await db.collection('fcm_tokens').doc(userId).get();
        if (tokenDoc.exists) {
          const userTokens = tokenDoc.data()?.tokens || [];
          const validTokens = userTokens.filter(isValidFCMToken);
          tokens.push(...validTokens);
        }
      }
    } else if (targetType === 'specific' && targetUsers) {
      for (const userId of targetUsers) {
        const tokenDoc = await db.collection('fcm_tokens').doc(userId).get();
        if (tokenDoc.exists) {
          const userTokens = tokenDoc.data()?.tokens || [];
          const validTokens = userTokens.filter(isValidFCMToken);
          tokens.push(...validTokens);
        }
      }
    }

    tokens = [...new Set(tokens)];

    if (tokens.length === 0) {
      const usersSnapshot = await db.collection('users').limit(1).get();
      const hasUsers = !usersSnapshot.empty;

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
      let suggestions: string[] = [];
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

    const response = await messaging.sendEachForMulticast(notificationPayload);

    const failedTokens: string[] = [];
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
          console.error(`Failed to send to token ${tokens[idx]}:`, resp.error);
        }
      });
    }

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
