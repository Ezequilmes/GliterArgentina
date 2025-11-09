import { NextResponse } from 'next/server';

/**
 * Genera un identificador único por solicitud para trazabilidad en logs.
 */
function generateRequestId(): string {
  return `mp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Valida el cuerpo de la preferencia y devuelve errores/advertencias.
 */
function validatePreferenceBody(body: any): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!body || typeof body !== 'object') {
    errors.push('Cuerpo de la solicitud inválido');
    return { errors, warnings };
  }

  // Validate items (requeridos)
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

    // Recomendados por checklist MCP
    if (!item.id || typeof item.id !== 'string') {
      warnings.push('items[0].id faltante (recomendado por MCP)');
    }
    if (!item.description || typeof item.description !== 'string') {
      warnings.push('items[0].description faltante (recomendado por MCP)');
    }
    if (!item.category_id || typeof item.category_id !== 'string') {
      warnings.push('items[0].category_id faltante (recomendado por MCP)');
    }
  }

  

  // back_urls (recomendado)
  if (body.back_urls) {
    const { success, failure, pending } = body.back_urls;
    for (const [key, url] of Object.entries({ success, failure, pending })) {
      if (url && typeof url === 'string' && !/^https?:\/\//.test(url)) {
        errors.push(`back_urls.${key} debe ser una URL válida http/https`);
      }
    }
  } else {
    warnings.push('back_urls faltante (recomendado por MCP)');
  }

  // notification_url (recomendado)
  if (body.notification_url && typeof body.notification_url === 'string') {
    if (!/^https?:\/\//.test(body.notification_url)) {
      errors.push('notification_url debe ser una URL válida http/https');
    }
  } else {
    warnings.push('notification_url faltante (recomendado por MCP)');
  }

  // Payer data (recomendado)
  if (body.payer) {
    if (!body.payer.email || typeof body.payer.email !== 'string') {
      warnings.push('payer.email faltante (recomendado por MCP)');
    }
    if (!body.payer.first_name || typeof body.payer.first_name !== 'string') {
      warnings.push('payer.first_name faltante (recomendado por MCP)');
    }
    if (!body.payer.last_name || typeof body.payer.last_name !== 'string') {
      warnings.push('payer.last_name faltante (recomendado por MCP)');
    }
  } else {
    warnings.push('payer faltante (recomendado por MCP)');
  }

  // Referencia externa (recomendado)
  if (!body.external_reference || typeof body.external_reference !== 'string') {
    warnings.push('external_reference faltante o inválido (recomendado por MCP)');
  }

  // Descriptor (buena práctica, máx 22)
  if (body.statement_descriptor && typeof body.statement_descriptor === 'string') {
    if (body.statement_descriptor.length > 22) {
      warnings.push('statement_descriptor supera 22 caracteres (MCP recomienda <=22)');
    }
  } else {
    warnings.push('statement_descriptor faltante (buena práctica MCP)');
  }

  // Modo binario (recomendado)
  if (typeof body.binary_mode !== 'boolean') {
    warnings.push('binary_mode faltante (recomendado por MCP)');
  }

  // Expiración (recomendado)
  if (body.date_of_expiration && typeof body.date_of_expiration === 'string') {
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[-+Z].*$/.test(body.date_of_expiration)) {
      warnings.push('date_of_expiration no parece ser fecha ISO válida');
    }
  } else {
    warnings.push('date_of_expiration faltante (recomendado por MCP)');
  }

  return { errors, warnings };
}

// Configuración para exportación estática
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = false;

/**
 * Resuelve la URL del webhook desde variables de entorno.
 * Si no está configurada explícitamente, intenta construirla desde NEXT_PUBLIC_APP_URL.
 */
function resolveWebhookUrl(): string | null {
  const fromEnv = process.env.MERCADOPAGO_WEBHOOK_URL;
  if (fromEnv) return fromEnv;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      return new URL('/api/mercadopago/webhook', appUrl).toString();
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Obtiene la base pública de la app para construir back_urls.
 */
function resolveAppUrl(): string | null {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (!appUrl) return null;
  try {
    // Valida que sea una URL
    // Si no es válida, new URL lanzará y devolvemos null.
    // No almacenamos el objeto URL para evitar variables sin uso.
    // Se construirá cada ruta inline donde se necesite.
    // eslint-disable-next-line no-new
    new URL('/', appUrl);
    return appUrl;
  } catch {
    return null;
  }
}

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
    const { errors: validationErrors, warnings } = validatePreferenceBody(body);
    if (validationErrors.length > 0) {
      console.error(`[${requestId}] Validation errors:`, validationErrors);
      return NextResponse.json(
        { error: 'Parámetros inválidos', details: validationErrors, requestId },
        { status: 400 }
      );
    }
    if (warnings.length > 0) {
      console.warn(`[${requestId}] MCP checklist warnings:`, warnings);
    }

    // Establecer notification_url por defecto si no viene en el body
    const webhookUrl = resolveWebhookUrl();
    if (webhookUrl && !body.notification_url) {
      body.notification_url = webhookUrl;
    }

    // Establecer back_urls por defecto si no vienen en el body
    if (!body.back_urls) {
      const appUrl = resolveAppUrl();
      if (appUrl) {
        body.back_urls = {
          success: new URL('/payment/success', appUrl).toString(),
          failure: new URL('/payment/failure', appUrl).toString(),
          pending: new URL('/payment/pending', appUrl).toString(),
        };
      }
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token de Mercado Pago no configurado', code: 'MCP_TOKEN_MISSING', requestId },
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
