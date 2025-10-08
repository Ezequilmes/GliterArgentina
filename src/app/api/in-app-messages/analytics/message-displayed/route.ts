import { NextRequest, NextResponse } from 'next/server';

// Configuración para exportación estática
export const dynamic = 'force-static';
export const revalidate = false;

export async function POST(request: NextRequest) {
  try {
    const analytics = await request.json();
    
    // Validar datos requeridos
    if (!analytics.messageId || !analytics.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields: messageId, timestamp' },
        { status: 400 }
      );
    }

    // En producción, aquí enviarías los datos a tu sistema de analytics
    // Por ejemplo: Google Analytics, Mixpanel, Amplitude, etc.
    
    if (process.env.NODE_ENV === 'production') {
      // Ejemplo de envío a Google Analytics 4
      if (process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) {
        await sendToGoogleAnalytics({
          event_name: 'in_app_message_displayed',
          parameters: {
            message_id: analytics.messageId,
            campaign_name: analytics.campaignName,
            custom_timestamp: analytics.timestamp
          }
        });
      }

      // Ejemplo de guardado en base de datos
      // await saveAnalyticsToDatabase({
      //   event_type: 'message_displayed',
      //   message_id: analytics.messageId,
      //   campaign_name: analytics.campaignName,
      //   timestamp: new Date(analytics.timestamp),
      //   user_agent: analytics.userAgent,
      //   ip_address: getClientIP(request)
      // });
    }

    // Log para desarrollo
    if (process.env.NODE_ENV !== 'production') {
      console.log('📊 In-App Message Analytics - Message Displayed:', {
        messageId: analytics.messageId,
        campaignName: analytics.campaignName,
        timestamp: analytics.timestamp
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing message analytics:', error);
    return NextResponse.json(
      { error: 'Failed to process analytics' },
      { status: 500 }
    );
  }
}

// Función auxiliar para enviar a Google Analytics
async function sendToGoogleAnalytics(event: any) {
  try {
    // Implementar envío a GA4 usando Measurement Protocol
    // https://developers.google.com/analytics/devguides/collection/protocol/ga4
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