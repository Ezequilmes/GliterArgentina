import { PremiumPlan, PaymentIntent } from '@/types';

// Configuración de MercadoPago
const IS_DEVELOPMENT = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_APP_URL?.includes('localhost');
const MP_PUBLIC_KEY = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY;
const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Validación de credenciales - solo advertir en producción si hay problemas críticos
if (!IS_DEVELOPMENT && MP_ACCESS_TOKEN?.startsWith('TEST-')) {
  console.warn('⚠️  ADVERTENCIA: Estás en producción pero usando credenciales de SANDBOX');
  console.warn('   Esto impedirá procesar pagos reales. Configura credenciales de producción.');
}

// Planes premium disponibles
export const PREMIUM_PLANS: PremiumPlan[] = [
  {
    id: 'gold_monthly',
    name: 'Gold Mensual',
    description: 'Acceso completo a todas las funciones premium por 1 mes',
    price: 500000, // En centavos (ARS $5.000)
    currency: 'ARS',
    duration: 30,
    features: [
      'Perfil destacado con badge dorado',
      'Aparece primero en las búsquedas',
      'Mensajes ilimitados',
      'Ver quién te agregó a favoritos',
      'Filtros avanzados de búsqueda',
      'Sin publicidad',
    ],
  },
  {
    id: 'gold_quarterly',
    name: 'Gold Trimestral',
    description: 'Acceso completo a todas las funciones premium por 3 meses',
    price: 1500000, // En centavos (ARS $15.000)
    currency: 'ARS',
    duration: 90,
    features: [
      'Perfil destacado con badge dorado',
      'Aparece primero en las búsquedas',
      'Mensajes ilimitados',
      'Ver quién te agregó a favoritos',
      'Filtros avanzados de búsqueda',
      'Sin publicidad',
      '17% de descuento vs mensual',
    ],
  },
  {
    id: 'gold_annual',
    name: 'Gold Anual',
    description: 'Acceso completo a todas las funciones premium por 1 año',
    price: 5000000, // En centavos (ARS $50.000)
    currency: 'ARS',
    duration: 365,
    features: [
      'Perfil destacado con badge dorado',
      'Aparece primero en las búsquedas',
      'Mensajes ilimitados',
      'Ver quién te agregó a favoritos',
      'Filtros avanzados de búsqueda',
      'Sin publicidad',
      '33% de descuento vs mensual',
      'Soporte prioritario',
    ],
  },
];

// Paquetes de Super Likes disponibles
export const SUPER_LIKE_PACKAGES = [
  {
    id: 'superlikes_5',
    amount: 5,
    price: 29900, // En centavos (ARS $299)
    currency: 'ARS',
    popular: false,
  },
  {
    id: 'superlikes_15',
    amount: 15,
    price: 69900, // En centavos (ARS $699)
    currency: 'ARS',
    popular: true,
  },
  {
    id: 'superlikes_30',
    amount: 30,
    price: 119900, // En centavos (ARS $1199)
    currency: 'ARS',
    popular: false,
  },
];

/**
 * Inicializa MercadoPago SDK
 */
export function initializeMercadoPago(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('MercadoPago solo puede ser inicializado en el cliente'));
      return;
    }

    // Validar que la Public Key esté configurada
    if (!MP_PUBLIC_KEY) {
      reject(new Error('Public Key de MercadoPago no configurada. Verifica NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY'));
      return;
    }

    // Cargar el SDK de MercadoPago si no está cargado
    if (!(window as any).MercadoPago) {
      const script = document.createElement('script');
      script.src = 'https://sdk.mercadopago.com/js/v2';
      script.onload = () => {
        const mp = new (window as any).MercadoPago(MP_PUBLIC_KEY);
        resolve(mp);
      };
      script.onerror = () => {
        reject(new Error('Error al cargar MercadoPago SDK'));
      };
      document.head.appendChild(script);
    } else {
      const mp = new (window as any).MercadoPago(MP_PUBLIC_KEY);
      resolve(mp);
    }
  });
}

/**
 * Crea una preferencia de pago en MercadoPago
 */
export async function createPaymentPreference(
  userId: string,
  planId: string,
  userEmail: string,
  userName: string
): Promise<PaymentIntent> {
  const plan = PREMIUM_PLANS.find(p => p.id === planId);
  if (!plan) {
    throw new Error('Plan no encontrado');
  }

  const preference = {
    items: [
      {
        id: plan.id,
        title: plan.name,
        description: plan.description,
        quantity: 1,
        unit_price: plan.price / 100, // Convertir de centavos a pesos
        currency_id: plan.currency,
      },
    ],
    payer: {
      email: userEmail,
      name: userName,
    },
    back_urls: {
      success: `${APP_URL}/payment/success`,
      failure: `${APP_URL}/payment/failure`,
      pending: `${APP_URL}/payment/pending`,
    },
    auto_return: 'approved',
    external_reference: `${userId}_${planId}_${Date.now()}`,
    notification_url: `${APP_URL}/api/webhooks/mercadopago`,
    metadata: {
      user_id: userId,
      plan_id: planId,
      plan_duration: plan.duration,
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

  try {
    const response = await fetch('/api/mercadopago/create-preference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    if (!response.ok) {
      throw new Error('Error al crear la preferencia de pago');
    }

    const data = await response.json();
    
    return {
      id: data.id,
      preferenceId: data.id,
      initPoint: data.init_point,
      sandboxInitPoint: data.sandbox_init_point,
      amount: plan.price,
      currency: plan.currency,
      status: 'pending',
      userId,
      planId,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error('Error al crear preferencia de pago:', error);
    throw error;
  }
}

/**
 * Crea una preferencia de pago para Super Likes
 */
export async function createSuperLikesPreference(
  userId: string,
  packageId: string,
  userEmail: string,
  userName: string
): Promise<PaymentIntent> {
  const package_ = SUPER_LIKE_PACKAGES.find(p => p.id === packageId);
  if (!package_) {
    throw new Error('Paquete de Super Likes no encontrado');
  }

  const preference = {
    items: [
      {
        id: package_.id,
        title: `${package_.amount} Super Likes`,
        description: `Paquete de ${package_.amount} Super Likes para aumentar tus posibilidades de match`,
        quantity: 1,
        unit_price: package_.price / 100, // Convertir de centavos a pesos
        currency_id: package_.currency,
      },
    ],
    payer: {
      email: userEmail,
      name: userName,
    },
    back_urls: {
      success: `${APP_URL}/payment/success`,
      failure: `${APP_URL}/payment/failure`,
      pending: `${APP_URL}/payment/pending`,
    },
    auto_return: 'approved',
    external_reference: `${userId}_${packageId}_${Date.now()}`,
    notification_url: `${APP_URL}/api/webhooks/mercadopago`,
    metadata: {
      user_id: userId,
      package_id: packageId,
      super_likes_amount: package_.amount,
      type: 'super_likes',
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

  try {
    const response = await fetch('/api/mercadopago/create-preference', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preference),
    });

    if (!response.ok) {
      throw new Error('Error al crear la preferencia de pago');
    }

    const data = await response.json();
    
    return {
      id: data.id,
      preferenceId: data.id,
      initPoint: data.init_point,
      sandboxInitPoint: data.sandbox_init_point,
      amount: package_.price,
      currency: package_.currency,
      status: 'pending',
      userId,
      planId: packageId,
      createdAt: new Date(),
    };
  } catch (error) {
    console.error('Error al crear preferencia de pago para Super Likes:', error);
    throw error;
  }
}

/**
 * Procesa el pago y actualiza el estado del usuario
 */
export async function processPayment(paymentId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/mercadopago/process-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ paymentId }),
    });

    if (!response.ok) {
      throw new Error('Error al procesar el pago');
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error al procesar pago:', error);
    throw error;
  }
}

/**
 * Verifica el estado de un pago
 */
export async function checkPaymentStatus(paymentId: string): Promise<string> {
  try {
    const response = await fetch(`/api/mercadopago/payment-status/${paymentId}`);
    
    if (!response.ok) {
      throw new Error('Error al verificar el estado del pago');
    }

    const data = await response.json();
    return data.status;
  } catch (error) {
    console.error('Error al verificar estado del pago:', error);
    throw error;
  }
}

/**
 * Obtiene el historial de pagos de un usuario
 */
export async function getUserPaymentHistory(userId: string): Promise<PaymentIntent[]> {
  try {
    const response = await fetch(`/api/mercadopago/payment-history/${userId}`);
    
    if (!response.ok) {
      throw new Error('Error al obtener el historial de pagos');
    }

    const data = await response.json();
    return data.payments;
  } catch (error) {
    console.error('Error al obtener historial de pagos:', error);
    throw error;
  }
}

/**
 * Cancela una suscripción premium
 */
export async function cancelPremiumSubscription(userId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/mercadopago/cancel-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Error al cancelar la suscripción');
    }

    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error al cancelar suscripción:', error);
    throw error;
  }
}

/**
 * Formatea el precio para mostrar
 */
export function formatPrice(price: number, currency: string = 'ARS'): string {
  const amount = price / 100; // Convertir de centavos
  
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Calcula el descuento entre planes
 */
export function calculateDiscount(originalPrice: number, discountedPrice: number): number {
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
}

/**
 * Obtiene el plan más popular (para destacar en la UI)
 */
export function getPopularPlan(): PremiumPlan {
  return PREMIUM_PLANS.find(plan => plan.id === 'gold_quarterly') || PREMIUM_PLANS[0];
}

/**
 * Valida si un usuario tiene una suscripción activa
 */
export function isSubscriptionActive(premiumUntil: Date | null): boolean {
  if (!premiumUntil) return false;
  return new Date() < new Date(premiumUntil);
}

/**
 * Calcula los días restantes de suscripción
 */
export function getDaysRemaining(premiumUntil: Date | null): number {
  if (!premiumUntil) return 0;
  
  const now = new Date();
  const endDate = new Date(premiumUntil);
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

/**
 * Obtiene el texto del estado de suscripción
 */
export function getSubscriptionStatusText(premiumUntil: Date | null): string {
  if (!premiumUntil) return 'Sin suscripción activa';
  
  const daysRemaining = getDaysRemaining(premiumUntil);
  
  if (daysRemaining === 0) {
    return 'Suscripción expirada';
  } else if (daysRemaining === 1) {
    return 'Expira mañana';
  } else if (daysRemaining <= 7) {
    return `Expira en ${daysRemaining} días`;
  } else {
    return `Activa hasta ${new Date(premiumUntil).toLocaleDateString('es-AR')}`;
  }
}