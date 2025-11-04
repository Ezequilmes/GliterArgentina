import { NextResponse } from 'next/server';

function generateRequestId() {
  return `mp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function validatePreferenceBody(body: any) {
  const errors: string[] = [];
  if (!body || typeof body !== 'object') {
    errors.push('Cuerpo de la solicitud inválido');
    return errors;
  }

  // Validate items
  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.push('items es requerido y debe tener al menos un elemento');
  } else {
    const item = body.items[0];
    if (!item.title || typeof item.title !== 'string') {
      errors.push('items[0].title es requerido');
    }
    if (typeof item.quantity !== 'number' || item.quantity < 1) {
      errors.push('items[0].quantity debe ser un número >= 1');
    }
    if (typeof item.unit_price !== 'number' || item.unit_price <= 0) {
      errors.push('items[0].unit_price debe ser un número > 0');
    }
    if (!item.currency_id || typeof item.currency_id !== 'string') {
      errors.push('items[0].currency_id es requerido');
    }
  }

  // Optional: validate back_urls
  if (body.back_urls) {
    const { success, failure, pending } = body.back_urls;
    for (const [key, url] of Object.entries({ success, failure, pending })) {
      if (url && typeof url === 'string' && !/^https?:\/\//.test(url)) {
        errors.push(`back_urls.${key} debe ser una URL válida http/https`);
      }
    }
  }

  // Optional: validate notification_url
  if (body.notification_url && typeof body.notification_url === 'string') {
    if (!/^https?:\/\//.test(body.notification_url)) {
      errors.push('notification_url debe ser una URL válida http/https');
    }
  }

  return errors;
}

// Configuración para exportación estática
export const dynamic = 'force-dynamic';
export const revalidate = false;

/**
 * POST /api/mercadopago/create-preference
 *
 * Esta ruta recibe un objeto de preferencia desde el frontend y lo reenvía a la API
 * de Mercado Pago usando el Access Token configurado en la variable de entorno
 * MERCADOPAGO_ACCESS_TOKEN. Devuelve la respuesta de Mercado Pago al cliente.
 */
export async function POST(req: Request) {
  try {
    const requestId = generateRequestId();
    const body = await req.json();

    // Basic payload validation to catch client-side issues early
    const validationErrors = validatePreferenceBody(body);
    if (validationErrors.length > 0) {
      console.error(`[${requestId}] Validation errors:`, validationErrors);
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: validationErrors, requestId },
        { status: 400 }
      );
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token de Mercado Pago no configurado' },
        { status: 500 }
      );
    }

    const mpResponse = await fetch(
      'https://api.mercadopago.com/checkout/preferences',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      }
    );

    if (!mpResponse.ok) {
      let errorPayload: any = null;
      try {
        errorPayload = await mpResponse.json();
      } catch {
        errorPayload = { raw: await mpResponse.text() };
      }
      console.error(`[${requestId}] Error al crear preferencia en Mercado Pago:`, errorPayload);
      return NextResponse.json(
        {
          error: 'Error al crear preferencia de pago',
          status: mpResponse.status,
          mpError: errorPayload,
          requestId,
        },
        { status: 502 }
      );
    }

    const data = await mpResponse.json();
    return NextResponse.json({ ...data, requestId });
  } catch (err) {
    const requestId = generateRequestId();
    console.error(`[${requestId}] Error en create-preference API:`, err);
    return NextResponse.json(
      { error: 'Error interno del servidor', requestId },
      { status: 500 }
    );
  }
}
