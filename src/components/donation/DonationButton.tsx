'use client';

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { Heart, X, HandHeart, Coffee, Users, Sparkles, Shield, Lock, CreditCard, RefreshCw } from 'lucide-react';
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
    name: '☕ Un Café para el Equipo',
    description: 'Invítanos un café y mantén la app funcionando',
    amount: 100000, // $1000 en centavos
    label: '$1.000',
    icon: Coffee,
    gradient: 'from-amber-500 to-orange-600'
  },
  {
    id: 'donation_2500',
    name: '🍕 Pizza para el Equipo',
    description: 'Una pizza para el equipo mientras desarrollamos nuevas funciones',
    amount: 250000, // $2500 en centavos
    label: '$2.500',
    icon: Heart,
    gradient: 'from-pink-500 to-rose-600'
  },
  {
    id: 'donation_5000',
    name: '🚀 Impulsa el Proyecto',
    description: 'Apoya significativamente el crecimiento de Gliter',
    amount: 500000, // $5000 en centavos
    label: '$5.000',
    icon: Sparkles,
    gradient: 'from-purple-500 to-indigo-600'
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
        className={`flex items-center justify-center p-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-110 ${className}`}
        title="Apoyar el proyecto con un café ☕"
      >
        <HandHeart className="w-5 h-5" />
      </button>

      {/* Modal de donación - Popup centrado usando React Portal */}
      {isModalOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          {/* Overlay con animación */}
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in-0 duration-300" 
            onClick={() => setIsModalOpen(false)}
          ></div>
          
          {/* Contenedor del modal - Ancho fijo amplio y centrado */}
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl w-[800px] max-w-none min-h-[60vh] max-h-[85vh] shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-300 overflow-y-auto mx-auto">
            {/* Header ampliado proporcional al nuevo tamaño */}
            <div className="bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 p-8 rounded-t-2xl relative">
              {/* Botón de cerrar */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all duration-200"
              >
                <X className="w-4 h-4 text-white" />
              </button>

              {/* Contenido del header ampliado */}
              <div className="text-center">
                <Heart className="w-8 h-8 text-white mx-auto mb-3" />
                <h2 className="text-3xl font-bold text-white mb-2">
                  Apoya a Gliter Argentina
                </h2>
                <p className="text-base text-white/90">
                  Tu apoyo nos ayuda a mejorar la plataforma
                </p>
              </div>
            </div>

            {/* Contenido del modal - Versión ampliada para mejor legibilidad */}
            <div className="p-10">
              {/* Sección de impacto - Ampliada */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 mb-8">
                <div className="flex items-center gap-3 mb-3">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Tu impacto
                  </h3>
                </div>
                <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                  Cada donación nos ayuda a mantener y mejorar la plataforma para todos los usuarios.
                </p>
              </div>

              {/* Opciones de donación - Grid ampliado para mejor legibilidad */}
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white text-center">
                  Elige tu aporte
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  {DONATION_PLANS.map((donation, index) => {
                    const IconComponent = donation.icon;
                    return (
                      <button
                        key={donation.id}
                        onClick={() => handleDonation(donation)}
                        disabled={!!isProcessing}
                        className={`p-4 bg-white dark:bg-gray-800 rounded-xl border-2 transition-all duration-200 ${
                          isProcessing === donation.id
                            ? 'border-gray-300 dark:border-gray-600'
                            : 'border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500'
                        }`}
                      >
                        <div className="text-center">
                          <IconComponent className="w-6 h-6 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                          <h4 className="text-lg font-bold text-gray-800 dark:text-white mb-1">
                            {donation.label}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {donation.description}
                          </p>
                          {/* Se cambia el <button> anidado por un <div> para evitar el error de anidamiento.
                              El <button> exterior ya maneja el click. */}
                          <div
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-bold py-2 px-4 rounded-lg transition-all duration-200 group-disabled:opacity-50"
                          >
                            {isProcessing === donation.id ? (
                              <div className="flex items-center justify-center space-x-1">
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Procesando</span>
                              </div>
                            ) : (
                              `Donar`
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer ampliado */}
              <div className="mt-8 pt-6 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl text-center">
                <p className="text-base text-gray-600 dark:text-gray-400">
                  💝 Gracias por tu apoyo
                </p>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default DonationButton;