import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = false;

/**
 * GET /api/mercadopago/config
 * Devuelve el estado de configuración de claves y URL de la app (sin exponer secretos).
 */
export async function GET() {
  try {
    const hasAccessToken = !!process.env.MERCADOPAGO_ACCESS_TOKEN;
    const hasPublicKey = !!process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || null;

    return NextResponse.json({
      hasAccessToken,
      hasPublicKey,
      appUrl,
    });
  } catch (error) {
    console.error('Error verificando configuración de Mercado Pago:', error);
    return NextResponse.json(
      { error: 'Error verificando configuración de Mercado Pago' },
      { status: 500 }
    );
  }
}

