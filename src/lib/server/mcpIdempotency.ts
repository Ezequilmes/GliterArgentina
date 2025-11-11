import { getFirestoreAdmin } from './firebaseAdmin';

/**
 * Verifica idempotencia para un pago y lo marca como procesado si aún no lo está.
 *
 * @param paymentId ID del pago en Mercado Pago.
 * @param payload Datos relevantes del pago para registrar (estado, monto, etc.).
 * @returns 'already_processed' si ya estaba registrado, 'marked' si se registró ahora.
 */
export async function checkAndMarkPaymentProcessed(
  paymentId: string,
  payload: { status?: string; status_detail?: string; amount?: number; topic?: string }
): Promise<'already_processed' | 'marked'> {
  const db = getFirestoreAdmin();
  const docRef = db.collection('mcp_processed_payments').doc(String(paymentId));
  const snapshot = await docRef.get();
  if (snapshot.exists) {
    return 'already_processed';
  }
  await docRef.set({
    id: String(paymentId),
    status: payload.status,
    status_detail: payload.status_detail,
    amount: payload.amount,
    at: new Date().toISOString(),
    topic: payload.topic || 'payment',
  }, { merge: true });
  return 'marked';
}

