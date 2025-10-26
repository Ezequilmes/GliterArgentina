'use client';

import React, { useState } from 'react';
import { Heart, X, HandHeart } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface DonationButtonProps {
  className?: string;
}

// Planes de donación
const DONATION_PLANS = [
  {
    id: 'donation_1000',
    name: 'Donación Básica',
    description: 'Ayuda a mantener la aplicación funcionando',
    amount: 100000, // $1000 en centavos
    label: '$1.000'
  },
  {
    id: 'donation_2500',
    name: 'Donación Estándar',
    description: 'Contribuye al desarrollo de nuevas funciones',
    amount: 250000, // $2500 en centavos
    label: '$2.500'
  },
  {
    id: 'donation_5000',
    name: 'Donación Premium',
    description: 'Apoya significativamente el proyecto',
    amount: 500000, // $5000 en centavos
    label: '$5.000'
  },
];

const DonationButton: React.FC<DonationButtonProps> = ({ className = '' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  const createDonationPreference = async (donationPlan: typeof DONATION_PLANS[0]) => {
    const preference = {
      items: [
        {
          id: donationPlan.id,
          title: donationPlan.name,
          description: donationPlan.description,
          quantity: 1,
          unit_price: donationPlan.amount / 100, // Convertir de centavos a pesos
          currency_id: 'ARS',
        },
      ],
      payer: {
        email: user?.email || '',
        name: user?.name || 'Usuario',
      },
      back_urls: {
        success: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/payment/success`,
        failure: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/payment/failure`,
        pending: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/payment/pending`,
      },
      auto_return: 'approved',
      external_reference: `donation_${user?.id}_${donationPlan.id}_${Date.now()}`,
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/webhooks/mercadopago`,
      metadata: {
        user_id: user?.id || '',
        donation_type: donationPlan.id,
        amount: donationPlan.amount,
        type: 'donation',
      },
      payment_methods: {
        excluded_payment_types: [],
        excluded_payment_methods: [],
        installments: 12,
      },
      shipments: {
        cost: 0,
        mode: 'not_specified',
      },
    };

    console.log('Enviando preferencia de donación:', preference);

    const response = await fetch('/api/mercadopago/create-preference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Error en create-preference:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(`Error al crear la preferencia de pago: ${response.status} - ${errorData}`);
    }

    return await response.json();
  };

  const handleDonation = async (donationPlan: typeof DONATION_PLANS[0]) => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión para hacer una donación');
      router.push('/auth/login');
      return;
    }

    setIsProcessing(donationPlan.id);
    
    try {
      const preference = await createDonationPreference(donationPlan);
      
      if (preference.init_point) {
        // Redirigir a MercadoPago
        window.location.href = preference.init_point;
      } else {
        throw new Error('No se pudo obtener el enlace de pago');
      }
    } catch (error) {
      console.error('Error al procesar donación:', error);
      toast.error('No se pudo procesar tu donación. Inténtalo nuevamente.');
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <>
      {/* Botón de donación */}
      <button
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center justify-center p-2 rounded-full bg-pink-500 hover:bg-pink-600 text-white transition-colors duration-200 ${className}`}
        title="Donar para el desarrollo"
      >
        <HandHeart className="w-5 h-5" />
      </button>

      {/* Modal de donación */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 relative">
            {/* Botón cerrar */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              disabled={!!isProcessing}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Contenido del modal */}
            <div className="text-center">
              <div className="mb-4">
                <Heart className="w-12 h-12 text-pink-500 mx-auto mb-2" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Apoya el desarrollo
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                  Tu donación nos ayuda a mejorar la aplicación y agregar nuevas funciones
                </p>
              </div>

              {/* Opciones de donación */}
              <div className="space-y-3">
                {DONATION_PLANS.map((donation) => (
                  <button
                    key={donation.id}
                    onClick={() => handleDonation(donation)}
                    disabled={!!isProcessing}
                    className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessing === donation.id ? 'Procesando...' : `Donar ${donation.label}`}
                  </button>
                ))}
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                Procesado de forma segura por MercadoPago
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DonationButton;