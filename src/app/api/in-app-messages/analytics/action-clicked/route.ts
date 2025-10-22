import { NextRequest, NextResponse } from 'next/server';

// Configuración para exportación estática
export const dynamic = 'force-dynamic';
export const revalidate = false;

export async function POST(request: NextRequest) {
  try {
    const analytics = await request.json();
    
    // Validar datos requeridos
    if (!analytics.messageId || !analytics.actionLabel || !analytics.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: messageId, actionLabel, timestamp' },
        { status: 400 }
      );
    }

    // En producción, aquí enviarías los datos a tu sistema de analytics
    if (process.env.NODE_ENV === 'production') {
      // Ejemplo de envío a Google Analytics 4
      if (process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) {
        await sendToGoogleAnalytics({
          event_name: 'in_app_message_action_clicked',
          parameters: {
            message_id: analytics.messageId,
            action_label: analytics.actionLabel,
            action_url: analytics.actionUrl,
            custom_timestamp: analytics.timestamp
          }
        });
      }

      // Ejemplo de guardado en base de datos
      // await saveAnalyticsToDatabase({
      //   event_type: 'action_clicked',
      //   message_id: analytics.messageId,
      //   action_label: analytics.actionLabel,
      //   action_url: analytics.actionUrl,
      //   timestamp: new Date(analytics.timestamp),
      //   user_agent: analytics.userAgent,
      //   ip_address: getClientIP(request)
      // });
    }

    // Log para desarrollo
    if (process.env.NODE_ENV !== 'production') {
      console.log('📊 In-App Message Analytics - Action Clicked:', {
        messageId: analytics.messageId,
        actionLabel: analytics.actionLabel,
        actionUrl: analytics.actionUrl,
        timestamp: analytics.timestamp
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing action analytics:', error);
    return NextResponse.json(
      { error: 'Failed to process analytics' },
      { status: 500 }
    );
  }
}

// Función auxiliar para enviar a Google Analytics
async function sendToGoogleAnalytics(event: any) {
  try {
    const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;
    const apiSecret = process.env.GA4_API_SECRET; // Configurar en variables de entorno
    
    if (!measurementId || !apiSecret) {
      console.warn('GA4 configuration missing');
      return;
    }

    const response = await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: 'in-app-messaging-service',
        events: [event]
      })
    });

    if (!response.ok) {
      console.warn('Failed to send to Google Analytics:', response.statusText);
    }
  } catch (error) {
    console.warn('Error sending to Google Analytics:', error);
  }
}

// Función auxiliar para obtener IP del cliente
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}