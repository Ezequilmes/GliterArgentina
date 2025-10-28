'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
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
  
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const externalReference = searchParams.get('external_reference');

  useEffect(() => {
    const verifyPayment = async () => {
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

        // Track premium purchase completed if payment was successful
        if (data.status === 'approved') {
          try {
            // Determine plan type based on amount (this is a simplified approach)
            const planType = data.amount >= 10000 ? 'yearly' : 'monthly';
            analyticsService.trackPremiumPurchaseCompleted(planType, data.amount);
          } catch (analyticsError) {
            console.error('Error tracking premium purchase completed:', analyticsError);
          }
        }
      } catch (err) {
        setError('Error al verificar el estado del pago');
        console.error('Error:', err);
      } finally {
        setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center space-y-6">
            {/* Animated Payment Icon */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-pink-500/20 border border-green-500/30 flex items-center justify-center mx-auto animate-pulse">
              <CheckCircle className="w-10 h-10 text-green-500 animate-bounce" />
            </div>

            {/* Loading Dots */}
            <div className="flex justify-center space-x-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 bg-green-500 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.2}s` }}
                />
              ))}
            </div>

            {/* Title and Message */}
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-foreground">
                Verificando tu pago
              </h3>
              <p className="text-muted-foreground">
                Confirmando los detalles de tu transacción...
              </p>
              <p className="text-sm text-muted-foreground/60">
                Esto solo tomará unos segundos
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="h-2 bg-gradient-to-r from-green-500 to-pink-500 rounded-full animate-pulse"
                style={{ width: '80%', animation: 'pulse 2s infinite' }}
              />
            </div>

            {/* Payment ID if available */}
            {paymentId && (
              <div className="text-xs text-muted-foreground/60 font-mono bg-muted/50 px-3 py-2 rounded">
                ID: {paymentId}
              </div>
            )}

            {/* Tip */}
            <div className="text-xs text-muted-foreground/60 italic">
              💳 Verificando el estado de tu pago con Mercado Pago
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white rounded-2xl shadow-xl p-8">
          <div className="text-red-500 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error de Verificación</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/premium"
            className="inline-flex items-center px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Premium
          </Link>
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-pink-500" />
          </div>
        }>
          <PaymentSuccessContent />
        </Suspense>
      </div>
    </div>
  );
}