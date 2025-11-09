import { NextResponse, NextRequest } from 'next/server';
import crypto from 'crypto';
import { analyticsService } from '@/services/analyticsService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = false;

/**
 * Webhook de Mercado Pago
 * - GET: healthcheck/validación
 * - POST: recepción de notificaciones (payment, merchant_order, etc.)
 */
export async function GET(_req: NextRequest) {
  return NextResponse.json({ status: 'ok' });
}

/**
 * POST /api/mercadopago/webhook
 *
 * Recibe notificaciones de Mercado Pago y valida la firma cuando aplica.
 * Requiere `MERCADOPAGO_ACCESS_TOKEN` configurado en el entorno.
 */
export async function POST(req: NextRequest) {
  const requestId = `wh_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    // Leer cuerpo crudo para verificación HMAC si hay secreto configurado
    const rawBody = await req.text();
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    const signatureHeader = req.headers.get('x-webhook-signature')
      || req.headers.get('x-hook-signature')
      || req.headers.get('x-signature');

    if (secret) {
      if (!signatureHeader) {
        console.warn(`[${requestId}] Falta cabecera de firma en webhook (x-webhook-signature/x-hook-signature/x-signature)`);
        return NextResponse.json({ error: 'Firma faltante', requestId }, { status: 401 });
      }
      const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
      const normalizedHeader = signatureHeader.startsWith('sha256=')
        ? signatureHeader.slice('sha256='.length)
        : signatureHeader;
      if (normalizedHeader !== expected) {
        console.error(`[${requestId}] Firma inválida en webhook`, { expected, received: normalizedHeader });
        return NextResponse.json({ error: 'Firma inválida', requestId }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody || '{}');

    // Tópico puede venir en distintas claves según configuración
    const topic: string | undefined = payload?.topic || payload?.type || payload?.action;
    const resource: string | undefined = payload?.resource;
    const dataId: string | number | undefined = payload?.data?.id || payload?.id;

    console.log(`[${requestId}] MCP webhook recibido`, { topic, resource, dataId });

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      console.error(`[${requestId}] MERCADOPAGO_ACCESS_TOKEN no configurado`);
      return NextResponse.json({ error: 'Access token no configurado', code: 'MCP_TOKEN_MISSING', requestId }, { status: 500 });
    }

    // Manejo básico de payments: recuperar estado actual
    if (topic === 'payment' || topic === 'payments') {
      const paymentId = typeof dataId === 'string' ? dataId : String(dataId || '');
      if (!paymentId && typeof resource === 'string') {
        const match = resource.match(/\/v1\/payments\/(\d+)/);
        if (match) {
          // extraer id de resource URL
          const [, id] = match;
          if (id) {
            const info = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              signal: AbortSignal.timeout(10000),
            });
            if (info.ok) {
              const data = await info.json();
              console.log(`[${requestId}] payment ${id} estado`, { status: data.status, status_detail: data.status_detail });
              try {
                analyticsService.trackEvent('premium_purchase_completed', {
                  plan_type: data.transaction_amount >= 10000 ? 'yearly' : 'monthly',
                  price: data.transaction_amount,
                  payment_method: 'mercadopago',
                });
              } catch (e) {
                // ignore analytics errors
              }
              return NextResponse.json({ ok: true, requestId });
            }
          }
        }
      } else if (paymentId) {
        const info = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(10000),
        });
        if (info.ok) {
          const data = await info.json();
          console.log(`[${requestId}] payment ${paymentId} estado`, { status: data.status, status_detail: data.status_detail });
          try {
            analyticsService.trackEvent('premium_purchase_completed', {
              plan_type: data.transaction_amount >= 10000 ? 'yearly' : 'monthly',
              price: data.transaction_amount,
              payment_method: 'mercadopago',
            });
          } catch (e) {}
          return NextResponse.json({ ok: true, requestId });
        }
      }
    }

    // Otros tópicos: merchant_order, etc. Por ahora solo registramos
    console.log(`[${requestId}] Tópico no manejado específicamente`, { topic });
    return NextResponse.json({ ok: true, requestId });
  } catch (err: any) {
    console.error('Error al procesar webhook de Mercado Pago:', err?.message || err);
    return NextResponse.json({ error: 'Error al procesar webhook' }, { status: 500 });
  }
}
