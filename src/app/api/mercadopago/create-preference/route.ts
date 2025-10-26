import { NextResponse } from 'next/server';

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
    const body = await req.json();

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
      const error = await mpResponse.text();
      console.error('Error al crear preferencia en Mercado Pago:', {
        status: mpResponse.status,
        statusText: mpResponse.statusText,
        error: error,
        requestBody: body
      });
      return NextResponse.json(
        { 
          error: 'Error al crear preferencia de pago',
          details: error,
          status: mpResponse.status
        },
        { status: mpResponse.status }
      );
    }

    const data = await mpResponse.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Error en create-preference API:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}