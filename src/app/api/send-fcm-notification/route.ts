import { NextRequest, NextResponse } from 'next/server';
import { messaging } from '../../../lib/firebase-admin';

export async function POST(request: NextRequest) {
  try {
    const { token, title, body, data, icon, badge, image, sound, category, actions } = await request.json();

    // Validar parámetros requeridos
    if (!token || !title || !body) {
      return NextResponse.json(
        { error: 'Token, title y body son requeridos' },
        { status: 400 }
      );
    }

    console.log('FCM: Enviando notificación real:', {
      token: token.substring(0, 20) + '...',
      title,
      body,
      hasData: !!data,
      hasIcon: !!icon
    });

    // Verificar si Firebase Admin está disponible
    if (!messaging) {
      console.warn('FCM: Firebase Admin no está configurado, enviando respuesta simulada');
      return NextResponse.json({
        success: true,
        messageId: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: 'Notificación simulada enviada (Firebase Admin no configurado)',
        isSimulated: true
      });
    }

    // Construir el mensaje FCM
    const message = {
      token,
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        sound: sound || 'default',
        category: category || 'general',
      },
      webpush: {
        notification: {
          icon: icon || '/icons/icon-192x192.png',
          badge: badge || '/icons/icon-96x96.png',
          image: image,
          requireInteraction: true,
          tag: category || 'general',
          renotify: true,
          actions: actions || [
            {
              action: 'open',
              title: 'Abrir',
            },
          ],
        },
        fcmOptions: {
          link: data?.url || '/',
        },
      },
    };

    // Enviar la notificación usando Firebase Admin
    const response = await messaging.send(message);

    console.log('FCM: Notificación enviada exitosamente:', {
      messageId: response,
      token: token.substring(0, 20) + '...'
    });

    return NextResponse.json({
      success: true,
      messageId: response,
      message: 'Notificación enviada exitosamente',
      isSimulated: false
    });

  } catch (error: any) {
    console.error('FCM: Error enviando notificación:', error);

    // Manejar errores específicos de FCM
    let errorMessage = 'Error desconocido';
    let statusCode = 500;

    if (error.code) {
      switch (error.code) {
        case 'messaging/invalid-registration-token':
          errorMessage = 'Token de registro inválido';
          statusCode = 400;
          break;
        case 'messaging/registration-token-not-registered':
          errorMessage = 'Token de registro no registrado';
          statusCode = 400;
          break;
        case 'messaging/invalid-payload':
          errorMessage = 'Payload de mensaje inválido';
          statusCode = 400;
          break;
        case 'messaging/invalid-data-payload-key':
          errorMessage = 'Clave de datos inválida en el payload';
          statusCode = 400;
          break;
        case 'messaging/payload-size-limit-exceeded':
          errorMessage = 'El tamaño del payload excede el límite';
          statusCode = 400;
          break;
        case 'messaging/invalid-options':
          errorMessage = 'Opciones de mensaje inválidas';
          statusCode = 400;
          break;
        case 'messaging/authentication-error':
          errorMessage = 'Error de autenticación con Firebase';
          statusCode = 401;
          break;
        case 'messaging/server-unavailable':
          errorMessage = 'Servidor de FCM no disponible';
          statusCode = 503;
          break;
        case 'messaging/internal-error':
          errorMessage = 'Error interno de FCM';
          statusCode = 500;
          break;
        default:
          errorMessage = `Error de FCM: ${error.code}`;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        code: error.code || 'unknown',
        details: error.message || 'Sin detalles adicionales'
      },
      { status: statusCode }
    );
  }
}

// Endpoint GET para verificar el estado del servicio
export async function GET() {
  try {
    const isConfigured = !!messaging;
    
    return NextResponse.json({
      success: true,
      fcmConfigured: isConfigured,
      message: isConfigured 
        ? 'Firebase Cloud Messaging está configurado y listo'
        : 'Firebase Cloud Messaging no está configurado (modo simulación)',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Error verificando configuración de FCM',
        details: error.message 
      },
      { status: 500 }
    );
  }
}