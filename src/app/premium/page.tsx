'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Crown, Star, Heart, Zap, Check, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { Card } from '@/components/ui';
import { toast } from 'react-hot-toast';
import { PREMIUM_PLANS, createPaymentPreference } from '@/lib/mercadopago';
import Link from 'next/link';
import { analyticsService } from '@/services/analyticsService';

export default function PremiumPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  // Track premium page view
  useEffect(() => {
    try {
      analyticsService.trackPremiumViewed('settings');
    } catch (error) {
      console.error('Error tracking premium viewed:', error);
    }
  }, []);

  const handlePurchase = async (planId: string) => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión para continuar');
      router.push('/auth/login');
      return;
    }

    const plan = PREMIUM_PLANS.find(p => p.id === planId);
    if (!plan) {
      toast.error('Plan no encontrado');
      return;
    }

    setLoading(planId);
    try {
      // Track premium purchase started
      const planType = plan.duration === 12 ? 'yearly' : 'monthly';
      analyticsService.trackPremiumPurchaseStarted(planType, plan.price);

      const preference = await createPaymentPreference(
        user.id,
        plan.id,
        user.email || '',
        user.name || 'Usuario'
      );

      if (preference.initPoint) {
        // Redirigir a MercadoPago
        window.location.href = preference.initPoint;
      } else {
        throw new Error('No se pudo obtener el enlace de pago');
      }
    } catch (error) {
      console.error('Error al crear preferencia de pago:', error);
      toast.error('Error al procesar el pago. Inténtalo de nuevo.');
    } finally {
      setLoading(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(price / 100);
  };

  const getMonthlyPrice = (price: number, duration: number) => {
    const monthlyPrice = (price / duration) * 30;
    return formatPrice(monthlyPrice);
  };

  const getSavingsPercentage = (price: number, duration: number) => {
    const monthlyPrice = PREMIUM_PLANS[0].price; // Precio del plan mensual
    const equivalentMonthlyPrice = (price / duration) * 30;
    const savings = ((monthlyPrice - equivalentMonthlyPrice) / monthlyPrice) * 100;
    return Math.round(savings);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/dashboard"
            className="flex items-center text-gray-800 dark:text-indigo-300 hover:text-gray-900 dark:hover:text-indigo-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver
          </Link>
          
          {user?.isPremium && (
            <div className="flex items-center bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-full">
              <Crown className="w-4 h-4 mr-2" />
              <span className="font-medium">Premium Activo</span>
            </div>
          )}
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-6">
            <Crown className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Gliter <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Premium</span>
          </h1>
          
          <p className="text-xl text-gray-700 dark:text-indigo-300 max-w-2xl mx-auto">
            Desbloquea todo el potencial de Gliter y encuentra conexiones más rápido
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            {
              icon: Star,
              title: 'Perfil Destacado',
              description: 'Aparece primero en las búsquedas con badge dorado',
              color: 'text-yellow-500',
            },
            {
              icon: Heart,
              title: 'Mensajes Ilimitados',
              description: 'Chatea sin límites con todos tus matches',
              color: 'text-pink-500',
            },
            {
              icon: Zap,
              title: 'Ver Quién Te Gusta',
              description: 'Descubre quién te agregó a favoritos',
              color: 'text-blue-500',
            },
            {
              icon: Crown,
              title: 'Sin Publicidad',
              description: 'Experiencia premium sin interrupciones',
              color: 'text-purple-500',
            },
          ].map((feature, index) => (
            <Card key={index} variant="default" padding="lg" className="text-center">
              <feature.icon className={`w-8 h-8 ${feature.color} mx-auto mb-4`} />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-700 dark:text-indigo-300">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>

        {/* Pricing Plans */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-8">
            Elige tu plan
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {PREMIUM_PLANS.map((plan, index) => {
              const isPopular = index === 1; // Plan trimestral como popular
              const savings = index > 0 ? getSavingsPercentage(plan.price, plan.duration) : 0;
              
              return (
                <Card
                  key={plan.id}
                  variant={isPopular ? "gold" : "default"}
                  padding="lg"
                  className={`relative ${isPopular ? 'ring-2 ring-yellow-400 scale-105' : ''}`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                        Más Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {plan.name}
                    </h3>
                    
                    <div className="mb-4">
                      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {formatPrice(plan.price)}
                      </div>
                      <div className="text-sm text-indigo-700 dark:text-indigo-300">
                        {getMonthlyPrice(plan.price, plan.duration)}/mes
                      </div>
                      {savings > 0 && (
                        <div className="text-sm font-medium text-green-600 dark:text-green-400">
                          Ahorra {savings}%
                        </div>
                      )}
                    </div>
                    
                    <p className="text-gray-700 dark:text-indigo-300 mb-6">
                      {plan.description}
                    </p>
                    
                    <div className="space-y-3 mb-6">
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center text-sm">
                          <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-indigo-200">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Button
                      onClick={() => handlePurchase(plan.id)}
                      disabled={loading === plan.id || user?.isPremium}
                      className={`w-full ${
                        isPopular
                          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
                          : 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600'
                      } text-white border-0`}
                    >
                      {loading === plan.id ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Procesando...
                        </div>
                      ) : user?.isPremium ? (
                        'Ya eres Premium'
                      ) : (
                        'Seleccionar Plan'
                      )}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Security Notice */}
        <div className="max-w-2xl mx-auto mt-12 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Pagos seguros con MercadoPago
            </h3>
            <p className="text-sm text-gray-700 dark:text-indigo-300">
              Todos los pagos son procesados de forma segura por MercadoPago. 
              Puedes cancelar tu suscripción en cualquier momento desde la configuración.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}