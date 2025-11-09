import { NextResponse, NextRequest } from 'next/server';
import { analyticsService } from '@/services/analyticsService';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const revalidate = false;

// Simple in-memory cache for payment status (5 minute TTL)
const paymentCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

// Rate limiting per payment ID
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(paymentId: string): boolean {
  const now = Date.now();
  const rateLimit = rateLimitMap.get(paymentId);
  
  if (!rateLimit || now - rateLimit.windowStart > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(paymentId, { count: 1, windowStart: now });
    return true;
  }
  
  if (rateLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  rateLimit.count++;
  return true;
}

function getCachedPayment(paymentId: string): any | null {
  const cached = paymentCache.get(paymentId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
}

function setCachedPayment(paymentId: string, data: any): void {
  paymentCache.set(paymentId, { data, timestamp: Date.now() });
}

/**
 * GET /api/mercadopago/payment-status/[paymentId]
 * Consulta el estado de un pago en Mercado Pago y devuelve información relevante.
 * Enhanced with caching, rate limiting, and retry logic.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  const { paymentId } = await params || {};

  if (!paymentId) {
    return NextResponse.json(
      { error: 'paymentId es requerido en la ruta' },
      { status: 400 }
    );
  }

  // Check rate limiting
  if (!checkRateLimit(paymentId)) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes. Por favor, intenta más tarde.' },
      { status: 429 }
    );
  }

  // Check cache first
  const cachedData = getCachedPayment(paymentId);
  if (cachedData) {
    console.log(`Payment ${paymentId} served from cache`);
    return NextResponse.json(cachedData);
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!accessToken) {
    console.error('MERCADOPAGO_ACCESS_TOKEN not configured');
    return NextResponse.json(
      { error: 'Access token de Mercado Pago no configurado', code: 'MCP_TOKEN_MISSING' },
      { status: 500 }
    );
  }

  // Retry logic with exponential backoff
  const maxRetries = 3;
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        // Add timeout to prevent hanging requests
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!mpRes.ok) {
        let errorPayload: any = null;
        try {
          errorPayload = await mpRes.json();
        } catch {
          errorPayload = { raw: await mpRes.text() };
        }
        
        // Don't retry on client errors (4xx)
        if (mpRes.status >= 400 && mpRes.status < 500) {
          console.error(`MercadoPago API client error for payment ${paymentId}:`, {
            status: mpRes.status,
            error: errorPayload
          });
          
          // Track API errors for monitoring
          try {
            analyticsService.trackEvent('premium_payment_verification_failed', {
              payment_id: paymentId,
              reason: `Client error ${mpRes.status}`,
              retry_count: attempt + 1
            });
          } catch (analyticsError) {
            console.error('Error tracking analytics:', analyticsError);
          }
          
          return NextResponse.json(
            {
              error: 'Error al consultar estado de pago en Mercado Pago',
              status: mpRes.status,
              mpError: errorPayload,
            },
            { status: 502 }
          );
        }
        
        // Server errors (5xx) - retry with backoff
        console.warn(`MercadoPago API server error for payment ${paymentId}, attempt ${attempt + 1}:`, {
          status: mpRes.status,
          error: errorPayload
        });
        
        lastError = { status: mpRes.status, error: errorPayload };
        
        // Exponential backoff: wait longer between retries
        if (attempt < maxRetries - 1) {
          const backoffDelay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          console.log(`Retrying in ${backoffDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
        continue;
      }

      const data = await mpRes.json();

      // Mapear respuesta a un payload compacto usado por el frontend
      const payload = {
        status: data.status,
        status_detail: data.status_detail,
        amount: data.transaction_amount,
        currency: data.currency_id,
        payment_method: data.payment_method_id || data.payment_type_id,
        date_approved: data.date_approved,
        id: data.id,
        external_reference: data.external_reference,
        payer: data.payer ? {
          email: data.payer.email,
          identification: data.payer.identification
        } : null,
        metadata: data.metadata || {},
      };

      // Cache successful responses
      setCachedPayment(paymentId, payload);
      
      // Track successful API calls
      try {
        analyticsService.trackEvent('premium_purchase_completed', {
          plan_type: data.transaction_amount >= 10000 ? 'yearly' : 'monthly',
          price: data.transaction_amount,
          payment_method: 'mercadopago'
        });
      } catch (analyticsError) {
        console.error('Error tracking analytics:', analyticsError);
      }

      return NextResponse.json(payload);
      
    } catch (error: any) {
      lastError = error;
      
      // Network/timeout errors - retry with backoff
      if (error.name === 'AbortError' || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
        console.warn(`Network error for payment ${paymentId}, attempt ${attempt + 1}:`, error.message);
        
        if (attempt < maxRetries - 1) {
          const backoffDelay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
          console.log(`Retrying in ${backoffDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      } else {
        // Other errors - don't retry
        console.error(`Non-retryable error for payment ${paymentId}:`, error);
        break;
      }
    }
  }
  
  // All retries exhausted
  console.error(`All retries exhausted for payment ${paymentId}:`, lastError);
  
  // Track final failure
  try {
    analyticsService.trackEvent('premium_payment_verification_failed', {
      payment_id: paymentId,
      reason: lastError?.message || 'Unknown error',
      retry_count: maxRetries
    });
  } catch (analyticsError) {
    console.error('Error tracking analytics:', analyticsError);
  }

  return NextResponse.json(
    { 
      error: 'Error al consultar estado de pago en Mercado Pago',
      details: 'Se agotaron todos los intentos de conexión',
      lastError: lastError?.message || 'Unknown error'
    },
    { status: 503 }
  );
}
