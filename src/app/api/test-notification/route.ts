import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { token, title, body } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: 'Token de registro requerido' },
        { status: 400 }
      );
    }

    // En desarrollo, simular el envío de notificación
    if (process.env.NODE_ENV === 'development') {
      console.log('🔔 Simulando envío de notificación en desarrollo');
      console.log('Token:', token.substring(0, 20) + '...');
      console.log('Título:', title || 'Notificación de Prueba');
      console.log('Cuerpo:', body || 'Esta es una notificación de prueba desde Gliter Argentina');
      
      // Simular un delay como si fuera una llamada real
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return NextResponse.json({
        success: true,
        messageId: `dev-simulation-${Date.now()}`,
        message: 'Notificación simulada exitosamente (modo desarrollo)',
        note: 'En producción, esto enviará una notificación real a través de Firebase Cloud Messaging'
      });
    }

    // Para producción, intentar usar Firebase Admin
    try {
      const { messaging, initializeFirebaseAdmin } = await import('@/lib/firebase-admin');
      
      // Verificar que Firebase Admin esté inicializado
      if (!initializeFirebaseAdmin()) {
        return NextResponse.json(
          { 
            error: 'Firebase Admin no está configurado',
            details: 'Las credenciales de Firebase Admin no están disponibles en producción'
          },
          { status: 500 }
        );
      }

      // Construir el mensaje de notificación
      const message = {
        token,
        notification: {
          title: title || 'Notificación de Prueba',
          body: body || 'Esta es una notificación de prueba desde Gliter Argentina',
        },
        webpush: {
          notification: {
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            requireInteraction: true,
            actions: [
              {
                action: 'open',
                title: 'Abrir',
              },
              {
                action: 'close',
                title: 'Cerrar',
              },
            ],
          },
        },
      };

      // Enviar la notificación
      const response = await messaging.send(message);
      
      return NextResponse.json({
        success: true,
        messageId: response,
        message: 'Notificación enviada exitosamente',
      });

    } catch (adminError) {
      console.error('Error con Firebase Admin:', adminError);
      return NextResponse.json(
        { 
          error: 'Error configurando Firebase Admin',
          details: adminError instanceof Error ? adminError.message : 'Error desconocido'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Error enviando notificación:', error);
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}