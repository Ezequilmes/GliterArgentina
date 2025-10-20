'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Clock, RefreshCw, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useSounds } from '@/hooks/useSounds';

function PaymentPendingContent() {
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [checkCount, setCheckCount] = useState(0);
  const [autoCheck, setAutoCheck] = useState(true);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const { playRefreshSound } = useSounds();
  
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const statusDetail = searchParams.get('status_detail');

  const checkPaymentStatus = async () => {
    if (!paymentId || loading) return;

    // Reproducir sonido de refresh
    playRefreshSound();
    
    setLoading(true);
    try {
      const response = await fetch(`/api/mercadopago/payment-status/${paymentId}`);
      
      if (response.ok) {
        const data = await response.json();
        setPaymentInfo(data);
        
        // Si el pago fue aprobado, redirigir a success
        if (data.status === 'approved') {
          router.push(`/payment/success?payment_id=${paymentId}&status=${data.status}`);
          return;
        }
        
        // Si el pago fue rechazado, redirigir a failure
        if (data.status === 'rejected') {
          router.push(`/payment/failure?payment_id=${paymentId}&status=${data.status}&status_detail=${data.status_detail}`);
          return;
        }
      }
    } catch (error) {
      console.error('Error al verificar pago:', error);
    } finally {
      setLoading(false);
      setCheckCount(prev => prev + 1);
    }
  };

  // Auto-verificación cada 10 segundos por 5 minutos
  useEffect(() => {
    if (!autoCheck || checkCount >= 30) return;

    const interval = setInterval(() => {
      checkPaymentStatus();
    }, 10000);

    // Verificación inicial
    if (checkCount === 0) {
      checkPaymentStatus();
    }

    return () => clearInterval(interval);
  }, [paymentId, autoCheck, checkCount]);

  const getPendingMessage = (statusDetail: string | null) => {
    const messages: { [key: string]: string } = {
      'pending_contingency': 'Estamos verificando tu pago con el banco',
      'pending_review_manual': 'Tu pago está siendo revisado manualmente',
      'pending_waiting_transfer': 'Esperando la transferencia bancaria',
      'pending_waiting_payment': 'Esperando confirmación del pago',
    };

    return messages[statusDetail || ''] || 'Tu pago está siendo procesado';
  };

  const getEstimatedTime = (statusDetail: string | null) => {
    const times: { [key: string]: string } = {
      'pending_contingency': '5-10 minutos',
      'pending_review_manual': '1-2 horas hábiles',
      'pending_waiting_transfer': '1-3 días hábiles',
      'pending_waiting_payment': '10-15 minutos',
    };

    return times[statusDetail || ''] || '10-30 minutos';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header con ícono de pendiente */}
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 p-8 text-center">
          <Clock className="h-16 w-16 text-white mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Pago Pendiente</h1>
          <p className="text-yellow-100 mt-2">Estamos procesando tu pago</p>
        </div>

        {/* Información del estado */}
        <div className="p-8">
          <div className="bg-yellow-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-yellow-900 mb-2">Estado Actual</h3>
            <p className="text-yellow-800 text-sm mb-3">
              {getPendingMessage(statusDetail)}
            </p>
            <div className="flex items-center text-sm text-yellow-700">
              <Clock className="h-4 w-4 mr-2" />
              <span>Tiempo estimado: {getEstimatedTime(statusDetail)}</span>
            </div>
          </div>

          {/* Información del pago */}
          {paymentInfo && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Detalles del Pago</h3>
              <div className="space-y-2 text-sm">
                {paymentInfo.amount && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monto:</span>
                    <span className="font-medium">
                      {new Intl.NumberFormat('es-AR', {
                        style: 'currency',
                        currency: paymentInfo.currency || 'ARS',
                      }).format(paymentInfo.amount)}
                    </span>
                  </div>
                )}
                {paymentInfo.payment_method && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Método de pago:</span>
                    <span className="font-medium capitalize">{paymentInfo.payment_method}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Estado:</span>
                  <span className="font-medium text-yellow-600">Pendiente</span>
                </div>
                {paymentId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID de pago:</span>
                    <span className="font-medium text-xs">{paymentId}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Verificación automática */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-blue-900">Verificación Automática</h3>
              <button
                onClick={() => setAutoCheck(!autoCheck)}
                className={`text-xs px-2 py-1 rounded ${
                  autoCheck 
                    ? 'bg-blue-200 text-blue-800' 
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {autoCheck ? 'Activada' : 'Desactivada'}
              </button>
            </div>
            <p className="text-blue-800 text-sm">
              {autoCheck 
                ? `Verificando cada 10 segundos (${checkCount}/30)`
                : 'Verificación automática desactivada'
              }
            </p>
          </div>

          {/* Botones de acción */}
          <div className="space-y-3">
            <button
              onClick={checkPaymentStatus}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center justify-center disabled:opacity-50 relative overflow-hidden"
            >
              {loading && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-blue-700/20 animate-pulse" />
              )}
              <RefreshCw className={`h-4 w-4 mr-2 z-10 ${loading ? 'animate-spin' : ''}`} />
              <span className="z-10">
                {loading ? (
                  <span className="flex items-center">
                    Verificando
                    <span className="ml-1 flex space-x-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1 h-1 bg-white rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 0.2}s` }}
                        />
                      ))}
                    </span>
                  </span>
                ) : (
                  'Verificar Estado'
                )}
              </span>
            </button>
            
            <Link
              href="/premium"
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center block flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Premium
            </Link>
          </div>

          {/* Información adicional */}
          <div className="mt-6 space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">¿Qué está pasando?</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  Tu pago está siendo verificado por el sistema bancario
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  Recibirás una notificación cuando se complete
                </li>
                <li className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  No es necesario realizar otro pago
                </li>
              </ul>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                ¿Necesitas ayuda?{' '}
                <Link href="/support" className="text-blue-500 hover:text-blue-600 font-medium">
                  Contacta soporte
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPendingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    }>
      <PaymentPendingContent />
    </Suspense>
  );
}