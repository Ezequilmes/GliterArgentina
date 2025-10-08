import { NextResponse } from 'next/server';

// Configuración para exportación estática
export const dynamic = 'force-static';
export const revalidate = false;

/**
 * POST /api/webhooks/mercadopago
 * Recibe notificaciones IPN/Webhook de Mercado Pago.
 * Solo valida la firma básica (si hubieras configurado Webhook Secret) y reenvía el cuerpo
 * o lo guarda para procesamiento asíncrono. Aquí solo respondemos 200 OK.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log('Webhook Mercado Pago recibido:', body);

    // TODO: aquí podrías actualizar la base de datos de usuario/pagos según body.action & body.data.id

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error en webhook Mercado Pago:', error);
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }
}