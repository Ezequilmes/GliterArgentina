/**
 * Mercado Pago auth and configuration helpers (server-side).
 *
 * TypeScript strict, ESLint-friendly, and JSDoc-documented utilities to centralize
 * access token retrieval and safe statement descriptor handling.
 */

/**
 * Retrieve Mercado Pago Access Token from known environment variable aliases.
 * Tries common names to avoid misconfiguration issues.
 *
 * @returns The access token string or null if not configured.
 */
export function getMercadoPagoAccessToken(): string | null {
  const envAny = process.env as Record<string, string | undefined>;
  return (
    envAny.MERCADOPAGO_ACCESS_TOKEN ||
    envAny.MERCADO_PAGO_ACCESS_TOKEN ||
    envAny.MP_ACCESS_TOKEN ||
    null
  );
}

/**
 * Retrieve a safe statement descriptor for Mercado Pago preferences.
 *
 * - Reads from MERCADOPAGO_STATEMENT_DESCRIPTOR (server-side)
 * - Trims whitespace and enforces max length of 22 characters (as per MCP docs)
 * - Returns undefined if not present or empty
 *
 * @returns A safe descriptor string limited to 22 chars or undefined.
 */
export function getStatementDescriptor(): string | undefined {
  const raw = (process.env.MERCADOPAGO_STATEMENT_DESCRIPTOR || '').trim();
  if (!raw) return undefined;
  // Enforce max length of 22 characters
  return raw.length > 22 ? raw.slice(0, 22) : raw;
}

/**
 * Ensure access token is present and appears valid. Throws descriptive errors when missing.
 *
 * @throws Error when token is missing
 * @returns The non-null access token string
 */
export function assertMercadoPagoAccessToken(): string {
  const token = getMercadoPagoAccessToken();
  if (!token) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN no está configurado');
  }
  return token;
}

