import { NextRequest, NextResponse } from 'next/server';
import { messaging } from '@/lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { token, title, body, userId } = await request.json();

    if (!token || !title || !body) {
      return NextResponse.json(
        { error: 'Missing required fields: token, title, body' },
        { status: 400 }
      );
    }

    // messaging ya está importado desde @/lib/firebase-admin

    // Create notification payload with corrected structure
    const notificationPayload = {
      notification: {
        title: title,
        body: body,
      },
      data: {
        type: 'test',
        userId: userId || 'test-user',
        timestamp: Date.now().toString(),
      },
      token: token,
      webpush: {
        headers: {
          Urgency: 'high',
        },
        notification: {
          title: title,
          body: body,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/icon-144x144.png',
          vibrate: [200, 100, 200],
          requireInteraction: true,
          silent: false,
          tag: 'test-notification',
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
        fcmOptions: {  // ✅ camelCase en lugar de snake_case
          link: '/',
        },
      },
    };

    console.log('📤 Enviando notificación de prueba...');
    console.log('Token:', token.substring(0, 30) + '...');
    console.log('Payload:', JSON.stringify(notificationPayload, null, 2));

    // Send the notification
    const response = await messaging.send(notificationPayload);

    console.log('✅ Notificación enviada exitosamente:', response);

    return NextResponse.json({
      success: true,
      messageId: response,
      message: 'Notificación enviada exitosamente'
    });

  } catch (error: any) {
    console.error('❌ Error enviando notificación de prueba:', error);
    
    // Manejar errores específicos de FCM
    if (error.code === 'messaging/invalid-registration-token') {
      return NextResponse.json(
        { error: 'Token de registro inválido', details: error.message },
        { status: 400 }
      );
    }
    
    if (error.code === 'messaging/registration-token-not-registered') {
      return NextResponse.json(
        { error: 'Token no registrado', details: error.message },
        { status: 400 }
      );
    }
    
    if (error.code === 'messaging/message-rate-exceeded') {
      return NextResponse.json(
        { error: 'Límite de tasa excedido', details: error.message },
        { status: 429 }
      );
    }
    
    if (error.code === 'messaging/invalid-argument') {
      return NextResponse.json(
        { error: 'Argumentos inválidos en el payload', details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Error enviando notificación', 
        details: error.message,
        code: error.code 
      },
      { status: 500 }
    );
  }
}