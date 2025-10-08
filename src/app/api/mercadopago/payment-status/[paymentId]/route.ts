import { NextResponse } from 'next/server';

/**
 * GET /api/mercadopago/payment-status/:paymentId
 * Consulta el estado de un pago en Mercado Pago usando el Access Token.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const { paymentId } = await params;

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    return NextResponse.json(
      { error: 'Access token de Mercado Pago no configurado' },
      { status: 500 }
    );
  }

  try {
    const mpRes = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!mpRes.ok) {
      const err = await mpRes.text();
      console.error('Error al obtener estado de pago:', err);
      return NextResponse.json(
        { error: 'Error al obtener estado del pago' },
        { status: 500 }
      );
    }

    const data = await mpRes.json();
    return NextResponse.json({ status: data.status, detail: data });
  } catch (error) {
    console.error('Error en payment-status API:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}