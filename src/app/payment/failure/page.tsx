'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { XCircle, RefreshCw, ArrowLeft, CreditCard } from 'lucide-react';
import Link from 'next/link';

function PaymentFailureContent() {
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const searchParams = useSearchParams();
  
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const statusDetail = searchParams.get('status_detail');

  const getFailureMessage = (statusDetail: string | null) => {
    const messages: { [key: string]: string } = {
      'cc_rejected_insufficient_amount': 'Fondos insuficientes en tu tarjeta',
      'cc_rejected_bad_filled_card_number': 'Número de tarjeta incorrecto',
      'cc_rejected_bad_filled_date': 'Fecha de vencimiento incorrecta',
      'cc_rejected_bad_filled_security_code': 'Código de seguridad incorrecto',
      'cc_rejected_call_for_authorize': 'Debes autorizar el pago con tu banco',
      'cc_rejected_card_disabled': 'Tu tarjeta está deshabilitada',
      'cc_rejected_duplicated_payment': 'Ya realizaste un pago similar recientemente',
      'cc_rejected_high_risk': 'Pago rechazado por seguridad',
      'cc_rejected_max_attempts': 'Superaste el límite de intentos',
      'cc_rejected_other_reason': 'Tu tarjeta rechazó el pago',
    };

    return messages[statusDetail || ''] || 'El pago no pudo ser procesado';
  };

  const getRecommendation = (statusDetail: string | null) => {
    const recommendations: { [key: string]: string[] } = {
      'cc_rejected_insufficient_amount': [
        'Verifica el saldo de tu tarjeta',
        'Intenta con otra tarjeta',
        'Contacta a tu banco'
      ],
      'cc_rejected_bad_filled_card_number': [
        'Verifica el número de tarjeta',
        'Asegúrate de escribir todos los dígitos',
        'Intenta nuevamente'
      ],
      'cc_rejected_bad_filled_date': [
        'Verifica la fecha de vencimiento',
        'Formato: MM/AA',
        'Asegúrate que la tarjeta no esté vencida'
      ],
      'cc_rejected_bad_filled_security_code': [
        'Verifica el código de seguridad (CVV)',
        'Son 3 dígitos en el reverso de la tarjeta',
        'O 4 dígitos en el frente (American Express)'
      ],
      'cc_rejected_call_for_authorize': [
        'Contacta a tu banco para autorizar el pago',
        'Informa que intentas hacer una compra online',
        'Intenta nuevamente después de la autorización'
      ],
      'cc_rejected_card_disabled': [
        'Contacta a tu banco',
        'Tu tarjeta puede estar bloqueada',
        'Intenta con otra tarjeta'
      ],
    };

    return recommendations[statusDetail || ''] || [
      'Verifica los datos de tu tarjeta',
      'Intenta con otro método de pago',
      'Contacta a nuestro soporte si el problema persiste'
    ];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header con ícono de error */}
        <div className="bg-gradient-to-r from-red-400 to-red-500 p-8 text-center">
          <XCircle className="h-16 w-16 text-white mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Pago Rechazado</h1>
          <p className="text-red-100 mt-2">No pudimos procesar tu pago</p>
        </div>

        {/* Información del error */}
        <div className="p-8">
          <div className="bg-red-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-red-900 mb-2">¿Qué pasó?</h3>
            <p className="text-red-800 text-sm">
              {getFailureMessage(statusDetail)}
            </p>
          </div>

          {/* Recomendaciones */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">¿Cómo solucionarlo?</h3>
            <ul className="text-sm text-gray-700 space-y-1">
              {getRecommendation(statusDetail).map((rec, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>

          {/* Información técnica */}
          {(paymentId || status || statusDetail) && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Detalles Técnicos</h3>
              <div className="space-y-2 text-sm">
                {paymentId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">ID de pago:</span>
                    <span className="font-medium text-xs">{paymentId}</span>
                  </div>
                )}
                {status && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado:</span>
                    <span className="font-medium capitalize">{status}</span>
                  </div>
                )}
                {statusDetail && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Detalle:</span>
                    <span className="font-medium text-xs">{statusDetail}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="space-y-3">
            <Link
              href="/premium"
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 px-4 rounded-lg font-medium hover:from-pink-600 hover:to-purple-600 transition-all duration-200 text-center block flex items-center justify-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Intentar Nuevamente
            </Link>
            
            <Link
              href="/premium"
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-600 transition-colors text-center block flex items-center justify-center"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Cambiar Método de Pago
            </Link>
            
            <Link
              href="/dashboard"
              className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center block flex items-center justify-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Dashboard
            </Link>
          </div>

          {/* Soporte */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿Necesitas ayuda?{' '}
              <Link href="/support" className="text-pink-500 hover:text-pink-600 font-medium">
                Contacta soporte
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <PaymentFailureContent />
    </Suspense>
  );
}