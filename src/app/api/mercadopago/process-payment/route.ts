// No NextResponse import to keep testability; use standard Response
import { z } from 'zod';
import { assertMercadoPagoAccessToken } from '@/lib/server/mercadopagoAuth';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = false;

/**
 * Schema de entrada para procesar pago.
 */
const ProcessPaymentSchema = z.object({
  paymentId: z.string().min(1, 'paymentId es requerido').regex(/^\d+$/, 'paymentId debe ser numérico'),
  externalReference: z.string().optional(),
});

/**
 * Genera un identificador único por solicitud para trazabilidad en logs.
 *
 * @returns Un string único para correlacionar logs.
 */
function generateRequestId(): string {
  return `proc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * POST /api/mercadopago/process-payment
 *
 * Procesa un pago de Mercado Pago consultando su estado actual y devolviendo
 * un resultado compacto. No realiza cambios de estado externos; sirve para
 * confirmar pagos en el backend de forma idempotente junto con el webhook.
 *
 * Requisitos:
 * - Tipado estricto y validación de inputs.
 * - Manejo de errores con detalles cuando es posible.
 *
 * @param req Next.js Request con body JSON { paymentId: string, externalReference?: string }
 * @returns JSON con estado del pago o error detallado.
 */
export async function POST(req: Request) {
  const requestId = generateRequestId();
  try {
    const body = await req.json();
    const parsed = ProcessPaymentSchema.safeParse(body);
    if (!parsed.success) {
      const issues = parsed.error.issues.map(i => ({ path: i.path.join('.'), message: i.message }));
      return jsonResponse(400, { error: 'Parámetros inválidos', details: issues, requestId });
    }

    const { paymentId } = parsed.data;
    const accessToken = assertMercadoPagoAccessToken();

    const signal = (typeof AbortSignal !== 'undefined' && typeof (AbortSignal as any).timeout === 'function')
      ? (AbortSignal as any).timeout(10000)
      : undefined;

    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      // En algunos entornos de test, AbortSignal.timeout no existe; usar condicional
      ...(signal ? { signal } : {}),
    });

    if (!response.ok) {
      let errorPayload: unknown;
      try {
        errorPayload = await response.json();
      } catch {
        errorPayload = { raw: await response.text() };
      }

      // Errores 4xx: no reintentar, devolver 502 con detalle
      if (response.status >= 400 && response.status < 500) {
        console.error(`[${requestId}] MCP client error for payment ${paymentId}`, { status: response.status, error: errorPayload });
        return jsonResponse(502, { error: 'Error al consultar pago en MCP', status: response.status, mpError: errorPayload, requestId });
      }

      // Errores 5xx: tratar como fallo temporal
      console.warn(`[${requestId}] MCP server error for payment ${paymentId}`, { status: response.status, error: errorPayload });
      return jsonResponse(503, { error: 'Servicio de MCP temporalmente no disponible', status: response.status, mpError: errorPayload, requestId });
    }

    const data = await response.json();
    const payload = {
      status: data.status,
      status_detail: data.status_detail,
      amount: data.transaction_amount,
      currency: data.currency_id,
      payment_method: data.payment_method_id || data.payment_type_id,
      date_approved: data.date_approved,
      id: data.id,
      external_reference: data.external_reference,
      payer: data.payer ? { email: data.payer.email, identification: data.payer.identification } : null,
      metadata: data.metadata || {},
    } as const;

    return jsonResponse(200, { success: true, payment: payload, requestId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[${requestId}] Error en process-payment`, message);
    return jsonResponse(500, { error: message, requestId });
  }
}
/**
 * Construye una respuesta JSON estándar (sin NextResponse) para mejor compatibilidad en tests.
 */
function jsonResponse(status: number, body: unknown): Response {
  // En entorno Next (runtime estándar), Response existe. En Jest puede no existir.
  if (typeof Response !== 'undefined') {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  }
  // Fallback para entorno de pruebas (Jest) sin Web Response global
  const text = JSON.stringify(body);
  const fallback: any = {
    status,
    headers: new Map([['content-type', 'application/json']]),
    json: async () => body,
    text: async () => text,
  };
  return fallback as Response;
}
