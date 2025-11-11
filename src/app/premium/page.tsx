'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Crown, Star, Heart, Zap, Check, ArrowLeft, Loader2, Shield, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';
import { Card } from '@/components/ui';
import { toast } from 'react-hot-toast';
import { PREMIUM_PLANS, createPaymentPreference, validateMercadoPagoConfig } from '@/lib/mercadopago';
import Link from 'next/link';
import { analyticsService } from '@/services/analyticsService';

/**
 * PremiumPage
 *
 * Página de selección y compra de planes Premium.
 * - Valida configuración de MercadoPago.
 * - Muestra planes con precios en ARS (centavos -> pesos).
 * - Crea preferencias de pago y redirige al checkout.
 */
export default function PremiumPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [configStatus, setConfigStatus] = useState<{ isValid: boolean; errors: string[] } | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Validate MercadoPago configuration on component mount
  useEffect(() => {
    const validateConfig = async () => {
      try {
        const config = validateMercadoPagoConfig();
        setConfigStatus(config);
        
        if (!config.isValid) {
          console.error('MercadoPago configuration errors:', config.errors);
          setError(`Error de configuración: ${config.errors.join(', ')}`);
        }
      } catch (error) {
        console.error('Error validating MercadoPago config:', error);
        setConfigStatus({ isValid: false, errors: ['Error al validar configuración'] });
      }
    };

    validateConfig();
  }, []);

  // Track premium page view
  useEffect(() => {
    try {
      analyticsService.trackPremiumViewed('settings');
    } catch (error) {
      console.error('Error tracking premium viewed:', error);
    }
  }, []);

  /**
   * Valida la consistencia del plan respecto a la progresión de precios.
   * Usa PREMIUM_PLANS como fuente de verdad para evitar falsos positivos.
   *
   * - Verifica que planes de mayor duración tengan mejor precio mensual equivalente.
   * - No bloquea por ids o montos hardcodeados: se basa en los datos del plan.
   */
  const validatePlanConsistency = (plan: typeof PREMIUM_PLANS[0]): boolean => {
    const monthlyPlan = PREMIUM_PLANS[0];
    const monthlyBaseline = (monthlyPlan.price / monthlyPlan.duration) * 30;
    const monthlyEquivalent = (plan.price / plan.duration) * 30;

    // Planes más largos deberían tener menor costo mensual equivalente que el mensual
    if (plan.id !== monthlyPlan.id && monthlyEquivalent >= monthlyBaseline) {
      console.warn(`Plan ${plan.id} no es más conveniente por mes: ${monthlyEquivalent} >= ${monthlyBaseline}`);
      // No bloqueamos la compra, solo avisamos para monitoreo
      return true;
    }
    return true;
  };

  /**
   * Valida que el monto sea razonable y coherente con los planes definidos.
   * Los montos se expresan en centavos ARS.
   */
  const validatePaymentAmount = (amount: number): { isValid: boolean; error?: string } => {
    // Mínimo de MP generalmente 1 ARS (100 centavos)
    if (amount < 100) {
      return { isValid: false, error: 'El monto mínimo es de $1.00 ARS' };
    }

    // Máximo razonable para premium
    if (amount > 10_000_00) { // $10.000 ARS en centavos
      return { isValid: false, error: 'El monto excede el límite permitido' };
    }

    if (!Number.isInteger(amount)) {
      return { isValid: false, error: 'El monto debe ser un número entero' };
    }

    const validPlanAmounts = new Set(PREMIUM_PLANS.map(p => p.price));
    if (!validPlanAmounts.has(amount)) {
      console.warn(`Monto de pago no coincide con los planes configurados: ${amount} (usuario: ${user?.id || 'N/A'})`);
    }

    return { isValid: true };
  };

  /**
   * Inicia el flujo de compra para un plan dado.
   * Valida configuración, plan, monto y datos del usuario
   * antes de crear la preferencia y redirigir al checkout.
   */
  const handlePurchase = async (planId: string) => {
    if (!user?.id) {
      toast.error('Debes iniciar sesión para continuar');
      router.push('/auth/login');
      return;
    }

    // Validate configuration before attempting payment
    const config = validateMercadoPagoConfig();
    if (!config.isValid) {
      const errorMessage = `Error de configuración: ${config.errors.join(', ')}`;
      console.error('Configuration validation failed:', errorMessage);
      toast.error('Error en la configuración del sistema. Por favor, contacta al soporte.');
      setError(errorMessage);
      
      // Track configuration error
      // Log configuration error for monitoring
      console.error('Premium configuration error:', {
        errors: config.errors,
        planId: planId,
        userId: user.id
      });
      return;
    }

    const plan = PREMIUM_PLANS.find(p => p.id === planId);
    if (!plan) {
      toast.error('Plan no encontrado');
      return;
    }

    // Validate plan consistency
    if (!validatePlanConsistency(plan)) {
      const errorMessage = 'Error en la configuración del plan. Por favor, contacta al soporte.';
      console.error('Plan consistency validation failed for plan:', planId);
      setError(errorMessage);
      toast.error(errorMessage);
      
      analyticsService.trackEvent('premium_purchase_failed', {
        plan_type: planId as 'monthly' | 'yearly',
        price: plan.price,
        reason: 'Plan consistency validation failed',
        payment_method: 'mercadopago',
        error_code: 'plan_consistency_error'
      });
      return;
    }

    // Validate payment amount
    const amountValidation = validatePaymentAmount(plan.price);
    if (!amountValidation.isValid) {
      console.error('Payment amount validation failed:', amountValidation.error);
      setError(amountValidation.error!);
      toast.error(amountValidation.error!);
      
      analyticsService.trackEvent('premium_purchase_failed', {
        plan_type: planId as 'monthly' | 'yearly',
        price: plan.price,
        reason: 'Payment amount validation failed',
        payment_method: 'mercadopago',
        error_code: 'amount_validation_error'
      });
      return;
    }

    // Validate user data
    if (!user.email || !user.email.includes('@')) {
      toast.error('Por favor, actualiza tu email en la configuración de tu perfil');
      router.push('/settings');
      return;
    }

    // Additional validation: prevent duplicate purchases if user is already premium
    if (user.isPremium) {
      toast.error('Ya tienes un plan premium activo');
      router.push('/dashboard');
      return;
    }

    setLoading(planId);
    setError(null);
    
    try {
      // Track premium purchase started
      const planType = plan.duration === 365 ? 'yearly' : plan.duration === 90 ? 'quarterly' : 'monthly';
      analyticsService.trackPremiumPurchaseStarted(planType as 'monthly' | 'yearly', plan.price);

      const preference = await createPaymentPreference(
        user.id,
        plan.id,
        user.email,
        user.name || 'Usuario'
      );

      if (preference.initPoint) {
        // Track successful preference creation
        analyticsService.trackEvent('premium_purchase_completed', {
          plan_type: planType as 'monthly' | 'yearly',
          price: plan.price,
          payment_method: 'mercadopago'
        });
        
        // Redirigir a MercadoPago
        window.location.href = preference.initPoint;
      } else {
        throw new Error('No se pudo obtener el enlace de pago');
      }
    } catch (error) {
      console.error('Error al crear preferencia de pago:', error);
      
      let errorMessage = 'Error al procesar el pago. Inténtalo de nuevo.';
      let errorType = 'unknown';
      
      if (error instanceof Error) {
        if (error.message.includes('configuration')) {
          errorMessage = 'Error en la configuración del sistema. Por favor, contacta al soporte.';
          errorType = 'configuration';
        } else if (error.message.includes('credentials')) {
          errorMessage = 'Error de autenticación con el proveedor de pagos.';
          errorType = 'credentials';
        } else if (error.message.includes('Invalid')) {
          errorMessage = 'Datos inválidos. Por favor, verifica tu información.';
          errorType = 'validation';
        } else if (error.message.includes('amount')) {
          errorMessage = 'Error en el monto del pago. Por favor, contacta al soporte.';
          errorType = 'amount_validation';
        } else {
          errorMessage = 'Error al procesar el pago. Por favor, intenta nuevamente.';
          errorType = 'processing';
        }
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      
      // Track payment error
      analyticsService.trackPremiumPurchaseFailed(
        error instanceof Error ? error.message : 'Unknown error',
        planId as 'monthly' | 'yearly',
        plan.price,
        errorType
      );
      
      // Increment retry count
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(null);
    }
  };

  /**
   * Formatea un precio en centavos ARS a string en pesos.
   */
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
    }).format(price / 100);
  };

  /**
   * Calcula el precio mensual equivalente de un plan (centavos ARS -> pesos).
   */
  const getMonthlyPrice = (price: number, duration: number) => {
    const monthlyPrice = (price / duration) * 30;
    return formatPrice(monthlyPrice);
  };

  /**
   * Calcula el porcentaje de ahorro frente al plan mensual.
   */
  const getSavingsPercentage = (price: number, duration: number) => {
    const monthlyPrice = PREMIUM_PLANS[0].price; // Centavos ARS del plan mensual
    const equivalentMonthlyPrice = (price / duration) * 30;
    const savings = monthlyPrice > 0 ? ((monthlyPrice - equivalentMonthlyPrice) / monthlyPrice) * 100 : 0;
    return Math.round(savings);
  };

  /**
   * Obtiene un rótulo legible del período del plan para acompañar el precio total.
   * Evita confusiones mostrando "por X meses" o "por 1 año" según la duración.
   *
   * @param duration Duración del plan en días (30, 90, 365)
   * @returns Texto descriptivo del período del plan
   */
  const getPeriodLabel = (duration: number): string => {
    if (duration === 30) return 'por 1 mes';
    if (duration === 90) return 'por 3 meses';
    if (duration === 365) return 'por 1 año';
    // Fallback genérico: convertir días a meses aproximados
    const approxMonths = Math.round(duration / 30);
    return `por ${approxMonths} ${approxMonths === 1 ? 'mes' : 'meses'}`;
  };

  /**
   * Reintenta validaciones de configuración y limpia errores.
   */
  const handleRetry = () => {
    setError(null);
    setRetryCount(0);
    // Re-validate configuration
    const config = validateMercadoPagoConfig();
    setConfigStatus(config);
    if (!config.isValid) {
      setError(`Error de configuración: ${config.errors.join(', ')}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-indigo-900/20">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        
        {/* Configuration Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-600 rounded-lg">
            <div className="flex items-center mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2" />
              <h3 className="text-red-800 dark:text-red-200 font-medium">Error de Configuración</h3>
            </div>
            <p className="text-red-700 dark:text-red-300 text-sm mb-3">{error}</p>
            <div className="flex space-x-2">
              <Button
                onClick={handleRetry}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/20"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Reintentar
              </Button>
              <Button
                onClick={() => window.location.href = '/support'}
                variant="outline"
                size="sm"
                className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-600 dark:text-red-300 dark:hover:bg-red-900/20"
              >
                Contactar Soporte
              </Button>
            </div>
          </div>
        )}

        {/* Configuration Status Indicator */}
        {configStatus && !configStatus.isValid && !error && (
          <div className="mb-6 p-4 bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-400 dark:border-yellow-600 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2" />
              <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                Algunas configuraciones no están completas. El pago podría no funcionar correctamente.
              </p>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <Link
            href="/dashboard"
            className="flex items-center text-gray-800 dark:text-indigo-300 hover:text-gray-900 dark:hover:text-indigo-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            <span className="text-sm sm:text-base">Volver</span>
          </Link>
          
          {user?.isPremium && (
            <div className="flex items-center bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 sm:px-4 sm:py-2 rounded-full">
              <Crown className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="font-medium text-xs sm:text-sm">Premium Activo</span>
            </div>
          )}
        </div>

        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-4 sm:mb-6">
            <Crown className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
            Gliter <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">Premium</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-gray-700 dark:text-indigo-300 max-w-2xl mx-auto px-4">
            Desbloquea todo el potencial de Gliter y encuentra conexiones más rápido
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-12">
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
            <Card key={index} variant="default" padding="lg" className="text-center p-3 sm:p-4 md:p-6">
              <feature.icon className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 ${feature.color} mx-auto mb-2 sm:mb-3 md:mb-4`} />
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 sm:mb-2 text-sm sm:text-base">
                {feature.title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-700 dark:text-indigo-300 leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>

        {/* Pricing Plans */}
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-6 sm:mb-8">
            Elige tu plan
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
            {PREMIUM_PLANS.map((plan, index) => {
              const isPopular = index === 1; // Plan trimestral como popular
              const savings = index > 0 ? getSavingsPercentage(plan.price, plan.duration) : 0;
              
              return (
                <Card
                  key={plan.id}
                  variant={isPopular ? "gold" : "default"}
                  padding="lg"
                  className={`relative p-4 sm:p-6 ${isPopular ? 'ring-2 ring-yellow-400 sm:scale-105' : ''}`}
                >
                  {isPopular && (
                    <div className="absolute -top-2 sm:-top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-0.5 sm:px-4 sm:py-1 rounded-full text-xs sm:text-sm font-medium">
                        Más Popular
                      </span>
                    </div>
                  )}
                  
                  <div className="text-center">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                      {plan.name}
                    </h3>
                    
                    <div className="mb-3 sm:mb-4">
                      <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {formatPrice(plan.price)}
                      </div>
                      {/* Rótulo del período total del plan para evitar confusión y precios "iguales" */}
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-indigo-300 mt-0.5">
                        {getPeriodLabel(plan.duration)}
                      </div>
                      {/* Precio mensual equivalente: ocultar en el plan mensual para evitar duplicar el mismo valor */}
                      {plan.duration !== 30 && (
                        <div className="text-xs sm:text-sm text-indigo-700 dark:text-indigo-300">
                          {getMonthlyPrice(plan.price, plan.duration)}/mes
                        </div>
                      )}
                      {savings > 0 && (
                        <div className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400">
                          Ahorra {savings}%
                        </div>
                      )}
                    </div>
                    
                    <p className="text-gray-700 dark:text-indigo-300 mb-4 sm:mb-6 text-sm sm:text-base">
                      {plan.description}
                    </p>
                    
                    <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                      {plan.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center text-xs sm:text-sm">
                          <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-indigo-200">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Button
                      onClick={() => handlePurchase(plan.id)}
                      disabled={loading === plan.id || user?.isPremium || !configStatus?.isValid}
                      className={`w-full py-2 sm:py-3 px-4 sm:px-6 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                        isPopular
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white shadow-lg hover:shadow-xl'
                          : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                      } ${loading === plan.id || !configStatus?.isValid ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {loading === plan.id ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                          Procesando...
                        </div>
                      ) : user?.isPremium ? (
                        'Plan Activo'
                      ) : !configStatus?.isValid ? (
                        'Pago no disponible'
                      ) : (
                        `Seleccionar ${plan.name}`
                      )}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Security Notice */}
        <div className="max-w-2xl mx-auto mt-8 sm:mt-12">
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 p-4 sm:p-6">
            <div className="flex items-start space-x-3 sm:space-x-4">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1 sm:mb-2 text-sm sm:text-base">
                  Pago 100% Seguro
                </h3>
                <p className="text-blue-800 dark:text-blue-200 text-xs sm:text-sm leading-relaxed">
                  Todos los pagos son procesados de forma segura por MercadoPago. 
                  Tus datos financieros están protegidos con encriptación de nivel bancario.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
