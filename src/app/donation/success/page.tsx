'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { analyticsService } from '@/services/analyticsService';

interface DonationInfo {
  status: string;
  amount: number;
  currency: string;
  payment_method: string;
  date_approved: string;
}

function DonationSuccessContent() {
  const [donationInfo, setDonationInfo] = useState<DonationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();

  const paymentId = searchParams.get('payment_id');

  useEffect(() => {
    const verifyDonation = async () => {
      if (!paymentId) {
        setError('ID de pago no encontrado');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/mercadopago/payment-status/${paymentId}`);
        if (!response.ok) {
          throw new Error('Error al verificar la donación');
        }

        const data = await response.json();
        setDonationInfo(data);

        if (data.status === 'approved') {
          try {
            analyticsService.trackDonationCompleted(data.amount, data.currency, 'general');
          } catch (analyticsError) {
            console.error('Error tracking donation completed:', analyticsError);
          }
        }
      } catch (err) {
        setError('Error al verificar el estado de la donación');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    verifyDonation();
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
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-pink-500/20 border border-green-500/30 flex items-center justify-center mx-auto animate-pulse">
            <CheckCircle className="w-10 h-10 text-green-500 animate-bounce" />
          </div>
          <h3 className="text-xl font-bold text-foreground mt-6">Verificando tu donación</h3>
          <p className="text-muted-foreground mt-2">Confirmando los detalles de tu aporte...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error de Verificación</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-green-400 to-green-500 p-8 text-center">
          <CheckCircle className="h-16 w-16 text-white mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">¡Gracias por tu donación!</h1>
          <p className="text-green-100 mt-2">Tu aporte nos ayuda a seguir creciendo</p>
        </div>

        <div className="p-8">
          {donationInfo && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Detalles de la Donación</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monto:</span>
                    <span className="font-medium">{formatAmount(donationInfo.amount, donationInfo.currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Método de pago:</span>
                    <span className="font-medium capitalize">{donationInfo.payment_method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estado:</span>
                    <span className="font-medium text-green-600">Aprobado</span>
                  </div>
                  {donationInfo.date_approved && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha:</span>
                      <span className="font-medium">{formatDate(donationInfo.date_approved)}</span>
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
                <h3 className="font-semibold text-pink-900 mb-2">Tu apoyo cuenta</h3>
                <ul className="text-sm text-pink-800 space-y-1">
                  <li>• Ayudas a costear infraestructura y mejoras</li>
                  <li>• Colaboras con nuevas funcionalidades</li>
                  <li>• Nos motivas a seguir construyendo</li>
                </ul>
              </div>
            </div>
          )}

          <div className="mt-8 space-y-3">
            <Link
              href="/dashboard"
              className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 px-4 rounded-lg font-medium hover:from-pink-600 hover:to-purple-600 transition-all duration-200 text-center block"
            >
              Ir al Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DonationSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-500/20 border border-pink-500/30 flex items-center justify-center mx-auto animate-pulse" />
            <h3 className="text-xl font-bold text-foreground">Cargando...</h3>
          </div>
        </div>
      </div>
    }>
      <DonationSuccessContent />
    </Suspense>
  );
}

