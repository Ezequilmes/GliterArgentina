import { NextResponse } from 'next/server';

/**
 * Ejecuta una verificación contra Mercado Pago con el token actual.
 *
 * - Comprueba presencia y formato del token.
 * - Realiza un ping autenticado a `users/me`.
 * - Devuelve un resultado sanitizado sin exponer secretos.
 */
async function checkMercadoPagoAccessToken(): Promise<Response> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  if (!accessToken) {
    return NextResponse.json(
      { ok: false, error: 'MERCADOPAGO_ACCESS_TOKEN no configurado' },
      { status: 500 }
    );
  }
  if (!/^APP_/.test(accessToken)) {
    return NextResponse.json(
      { ok: false, error: 'Formato de token inesperado' },
      { status: 500 }
    );
  }

  const res = await fetch('https://api.mercadopago.com/users/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    let errorInfo: unknown = null;
    try {
      errorInfo = await res.json();
    } catch {
      errorInfo = { statusText: res.statusText };
    }
    return NextResponse.json(
      { ok: false, status: res.status, error: errorInfo },
      { status: 502 }
    );
  }

  const data = (await res.json()) as {
    id?: number;
    site_id?: string;
  };

  return NextResponse.json({ ok: true, user_id: data.id, site_id: data.site_id });
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = false;

/**
 * Verifica si el token secreto de Mercado Pago está disponible en runtime
 * y válido realizando una solicitud autenticada mínima.
 *
 * No expone el valor del token; devuelve solo un estado y datos sanitizados.
 */
export async function GET() {
  try {
    return await checkMercadoPagoAccessToken();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
