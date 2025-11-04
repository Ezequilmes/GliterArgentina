'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader2, ArrowLeft, XCircle } from 'lucide-react';
import Link from 'next/link';
import { analyticsService } from '@/services/analyticsService';

interface PaymentInfo {
  status: string;
  amount: number;
  currency: string;
  payment_method: string;
  date_approved: string;
}

function PaymentSuccessContent() {
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const externalReference = searchParams.get('external_reference');

  useEffect(() => {
    const startTime = Date.now();
    
    const verifyPayment = async (currentRetryCount = 0) => {
      const maxRetries = 3;
      const retryDelay = 2000; // 2 seconds

      if (!paymentId) {
        setError('ID de pago no encontrado');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/mercadopago/payment-status/${paymentId}`);
        
        if (!response.ok) {
          throw new Error('Error al verificar el pago');
        }

        const data = await response.json();
        setPaymentInfo(data);
        setRetryCount(currentRetryCount);

        // Track premium purchase completed if payment was successful
        if (data.status === 'approved') {
          try {
            // Determine plan type based on amount (this is a simplified approach)
            const planType = data.amount >= 10000 ? 'yearly' : 'monthly';
            analyticsService.trackPremiumPurchaseCompleted(planType, data.amount);
            
            // Track payment verification recovery if we had retries
            if (currentRetryCount > 0) {
              const timeToRecovery = Date.now() - startTime;
              analyticsService.trackPremiumPaymentVerificationRecovered(
                paymentId,
                currentRetryCount,
                timeToRecovery
              );
            }
          } catch (analyticsError) {
            console.error('Error tracking premium purchase completed:', analyticsError);
          }
        } else if (data.status === 'pending' && currentRetryCount < maxRetries) {
          console.log(`Payment still pending, retrying in ${retryDelay}ms... (attempt ${currentRetryCount + 1}/${maxRetries})`);
          
          // Track payment verification failure
          analyticsService.trackPremiumPaymentVerificationFailed(
            paymentId,
            'Payment still pending',
            currentRetryCount
          );
          
          setTimeout(() => verifyPayment(currentRetryCount + 1), retryDelay);
          return;
        }
      } catch (err) {
        console.error('Error:', err);
        
        // Track payment verification failure
        analyticsService.trackPremiumPaymentVerificationFailed(
          paymentId,
          err instanceof Error ? err.message : 'Unknown error',
          currentRetryCount
        );
        
        // Retry on network errors
        if (currentRetryCount < maxRetries) {
          console.log(`Error verifying payment, retrying in ${retryDelay}ms... (attempt ${currentRetryCount + 1}/${maxRetries})`);
          setTimeout(() => verifyPayment(currentRetryCount + 1), retryDelay);
          return;
        }
        setError('Error al verificar el estado del pago');
      } finally {
        if (currentRetryCount === 0) {
          setLoading(false);
        }
      }
    };

    verifyPayment();
  }, [paymentId]);

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency || 'ARS',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setRetryCount(0);
    // Restart the verification process
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="relative mx-auto mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-500 mx-auto"></div>
              <div className="absolute inset-0 rounded-full h-16 w-16 border-t-2 border-purple-500 animate-spin animation-delay-200"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Verificando tu pago...</h2>
            <p className="text-gray-600 mb-6">Por favor espera mientras confirmamos tu transacción.</p>
            
            <div className="space-y-4">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-gradient-to-r from-pink-500 to-purple-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${Math.min((retryCount || 0) * 25, 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500">Intento {retryCount || 0} de 3</p>
              
              {(retryCount || 0) > 1 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <span className="font-medium">Nota:</span> Esto puede tomar unos momentos más de lo habitual.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Error al verificar el pago</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            
            {retryCount >= 3 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-red-800 mb-2">¿Qué puedes hacer?</h3>
                <ul className="text-sm text-red-700 space-y-1 text-left">
                  <li>• Verifica tu conexión a internet</li>
                  <li>• Comprueba que el pago se haya procesado en Mercado Pago</li>
                  <li>• Contacta a soporte si el problema persiste</li>
                </ul>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleRetry}
                disabled={retryCount >= 3}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  retryCount >= 3
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-pink-500 text-white hover:bg-pink-600 hover:shadow-lg'
                }`}
              >
                {retryCount >= 3 ? 'Límite de intentos alcanzado' : 'Reintentar'}
              </button>
              <button
                onClick={() => window.location.href = '/premium'}
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Volver a Premium
              </button>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500 mb-3">¿Necesitas ayuda?</p>
              <a
                href="mailto:soporte@glitterargentina.com"
                className="text-pink-600 hover:text-pink-700 font-medium text-sm"
              >
                Contactar a soporte
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header con ícono de éxito */}
        <div className="bg-gradient-to-r from-green-400 to-green-500 p-8 text-center">
          <CheckCircle className="h-16 w-16 text-white mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">¡Pago Exitoso!</h1>
          <p className="text-green-100 mt-2">Tu suscripción premium ha sido activada</p>
        </div>

        {/* Información del pago */}
        <div className="p-8">
          {paymentInfo && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Detalles del Pago</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monto:</span>
                    <span className="font-medium">{formatAmount(paymentInfo.amount, paymentInfo.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Método de pago:</span>
                    <span className="font-medium capitalize">{paymentInfo.payment_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado:</span>
                    <span className="font-medium text-green-600">Aprobado</span>
                  </div>
                  {paymentInfo.date_approved && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha:</span>
                      <span className="font-medium">{formatDate(paymentInfo.date_approved)}</span>
                    </div>
                  )}
                  {paymentId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID de pago:</span>
                      <span className="font-medium text-xs">{paymentId}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-pink-50 rounded-lg p-4">
                <h3 className="font-semibold text-pink-900 mb-2">¿Qué sigue?</h3>
                <ul className="text-sm text-pink-800 space-y-1">
                  <li>• Tu cuenta premium está activa</li>
                  <li>• Disfruta de todas las funciones premium</li>
                  <li>• Recibirás un email de confirmación</li>
                </ul>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="mt-8 space-y-3">
            <Link
              href="/dashboard"
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 px-4 rounded-lg font-medium hover:from-pink-600 hover:to-purple-600 transition-all duration-200 text-center block"
            >
              Ir al Dashboard
            </Link>
            <Link
              href="/premium"
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center block"
            >
              Ver Planes Premium
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center space-y-6">
            {/* Animated Loading Icon */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 flex items-center justify-center mx-auto animate-pulse">
              <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
            </div>

            {/* Loading Dots */}
            <div className="flex justify-center space-x-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>

            {/* Title and Message */}
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground">
                Cargando página
              </h3>
              <p className="text-muted-foreground">
                Preparando la información de tu pago...
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="h-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full animate-pulse"
                style={{ width: '60%', animation: 'pulse 2s infinite' }}
              />
            </div>

            {/* Tip */}
            <div className="text-xs text-muted-foreground/60 italic">
              🎉 Preparando tu experiencia premium
            </div>
          </div>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}