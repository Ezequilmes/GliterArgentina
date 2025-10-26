import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Configuración para rutas dinámicas
export const dynamic = 'force-dynamic';

// Clave secreta del webhook (debe estar en variables de entorno)
const WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET || '';

/**
 * Valida la firma del webhook según la documentación oficial de Mercado Pago
 * @param signature - Header x-signature
 * @param requestId - Header x-request-id
 * @param dataId - ID del evento desde el body
 * @param body - Cuerpo completo de la notificación
 * @returns boolean - true si la firma es válida
 */
function validateWebhookSignature(
  signature: string,
  requestId: string,
  dataId: string,
  body: any
): boolean {
  if (!WEBHOOK_SECRET || !signature) {
    console.warn('Webhook secret o signature no disponible');
    return false;
  }

  try {
    // Extraer timestamp y firma del header x-signature
    const parts = signature.split(',');
    let ts = '';
    let v1 = '';
    
    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 'ts') ts = value;
      if (key === 'v1') v1 = value;
    }

    if (!ts || !v1) {
      console.error('Formato de signature inválido');
      return false;
    }

    // Construir el template según la documentación
    // id:[data.id_url];request-id:[x-request-id_header];ts:[ts_header];
    const template = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
    
    // Generar HMAC SHA256
    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(template)
      .digest('hex');

    // Comparar firmas
    return crypto.timingSafeEqual(
      Buffer.from(v1, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Error validando firma del webhook:', error);
    return false;
  }
}

/**
 * Procesa la notificación de pago de Mercado Pago
 * @param paymentData - Datos del pago
 */
async function processPaymentNotification(paymentData: any) {
  try {
    console.log('Procesando notificación de pago:', paymentData);
    
    // TODO: Implementar lógica de procesamiento de pagos
    // - Actualizar estado del usuario a premium
    // - Activar funcionalidades premium
    // - Enviar notificación al usuario
    // - Registrar en base de datos
    
    // Ejemplo de estructura esperada:
    // {
    //   id: "payment_id",
    //   live_mode: true,
    //   type: "payment",
    //   date_created: "2023-01-01T00:00:00.000Z",
    //   user_id: 123456,
    //   api_version: "v1",
    //   action: "payment.created" | "payment.updated",
    //   data: { id: "999999999" }
    // }
    
  } catch (error) {
    console.error('Error procesando notificación de pago:', error);
    throw error;
  }
}

/**
 * Procesa la notificación de orden comercial de Mercado Pago
 * @param orderData - Datos de la orden
 */
async function processMerchantOrderNotification(orderData: any) {
  try {
    console.log('Procesando notificación de orden comercial:', orderData);
    
    // TODO: Implementar lógica de procesamiento de órdenes
    // - Verificar estado de la orden
    // - Actualizar estado en base de datos
    // - Procesar elementos de la orden
    
  } catch (error) {
    console.error('Error procesando notificación de orden:', error);
    throw error;
  }
}

/**
 * POST /api/webhooks/mercadopago
 * Recibe notificaciones IPN/Webhook de Mercado Pago.
 * Valida la firma según la documentación oficial y procesa las notificaciones.
 */
export async function POST(req: Request) {
  try {
    // Obtener headers necesarios
    const signature = req.headers.get('x-signature') || '';
    const requestId = req.headers.get('x-request-id') || '';
    
    // Obtener el cuerpo de la notificación
    const body = await req.json();
    
    console.log('Webhook Mercado Pago recibido:', {
      type: body.type,
      action: body.action,
      dataId: body.data?.id,
      timestamp: new Date().toISOString()
    });

    // Validar firma si está configurada
    if (WEBHOOK_SECRET) {
      const isValidSignature = validateWebhookSignature(
        signature,
        requestId,
        body.data?.id || '',
        body
      );

      if (!isValidSignature) {
        console.error('Firma del webhook inválida');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
      
      console.log('Firma del webhook validada correctamente');
    } else {
      console.warn('Webhook secret no configurado - saltando validación de firma');
    }

    // Procesar según el tipo de notificación
    switch (body.type) {
      case 'payment':
        await processPaymentNotification(body);
        break;
        
      case 'merchant_order':
        await processMerchantOrderNotification(body);
        break;
        
      default:
        console.log(`Tipo de notificación no manejado: ${body.type}`);
    }

    // Responder con 200 OK para confirmar recepción
    return NextResponse.json({ 
      received: true,
      processed: true,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error en webhook Mercado Pago:', error);
    
    // Responder con error pero no 500 para evitar reenvíos innecesarios
    return NextResponse.json({ 
      error: 'Processing error',
      received: true,
      processed: false,
      timestamp: new Date().toISOString()
    }, { status: 200 });
  }
}