'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Modal } from '@/components/ui';
import { Button } from '@/components/ui';
import { Crown, Star, Heart, Zap, Check, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { analyticsService } from '@/services/analyticsService';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'premium' | 'superlikes';
}

export function PremiumModal({ isOpen, onClose, initialTab = 'premium' }: PremiumModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading, setLoading] = useState(false);

  // Track premium modal view when opened
  useEffect(() => {
    if (isOpen) {
      try {
        analyticsService.trackPremiumViewed('popup');
      } catch (error) {
        console.error('Error tracking premium viewed:', error);
      }
    }
  }, [isOpen]);

  const handlePurchasePremium = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Track premium purchase started
      analyticsService.trackPremiumPurchaseStarted('monthly', 999);

      // Simular compra premium (aquí integrarías con MercadoPago)
      await updateDoc(doc(db, 'users', user.id), {
        isPremium: true,
        premiumExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
        superLikes: 999 // Super likes ilimitados
      });

      // Track premium purchase completed
      analyticsService.trackPremiumPurchaseCompleted('monthly', 999);

      toast.success('¡Bienvenido a Premium! 👑');
      onClose();
    } catch (error) {
      console.error('Error purchasing premium:', error);
      toast.error('Error al procesar la compra');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseSuperLikes = async (amount: number) => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Simular compra de super likes (aquí integrarías con MercadoPago)
      await updateDoc(doc(db, 'users', user.id), {
        superLikes: increment(amount)
      });

      toast.success(`¡${amount} Super Likes agregados! ⭐`);
      onClose();
    } catch (error) {
      console.error('Error purchasing super likes:', error);
      toast.error('Error al procesar la compra');
    } finally {
      setLoading(false);
    }
  };

  const premiumFeatures = [
    { icon: Star, text: 'Super Likes ilimitados', color: 'text-yellow-500' },
    { icon: Heart, text: 'Likes ilimitados', color: 'text-pink-500' },
    { icon: Zap, text: 'Ver quién te dio like', color: 'text-blue-500' },
    { icon: Crown, text: 'Perfil destacado', color: 'text-purple-500' },
  ];

  const superLikePackages = [
    { amount: 5, price: 299, popular: false },
    { amount: 15, price: 699, popular: true },
    { amount: 30, price: 1199, popular: false },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-3 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-6">
          <div className="flex items-center space-x-2">
            <Crown className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 flex-shrink-0" />
            <h2 className="text-base sm:text-xl font-bold text-gray-900 dark:text-gray-100 truncate">
              Gliter Premium
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0 touch-manipulation">
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1 mb-3 sm:mb-6">
          <button
            onClick={() => setActiveTab('premium')}
            className={`flex-1 py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors touch-manipulation ${
              activeTab === 'premium'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            Premium
          </button>
          <button
            onClick={() => setActiveTab('superlikes')}
            className={`flex-1 py-2 px-2 sm:px-4 rounded-md text-xs sm:text-sm font-medium transition-colors touch-manipulation ${
              activeTab === 'superlikes'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
            }`}
          >
            <span className="hidden sm:inline">Super Likes</span>
            <span className="sm:hidden">Likes</span>
          </button>
        </div>

        {/* Premium Tab */}
        {activeTab === 'premium' && (
          <div className="space-y-4 sm:space-y-6">
            {/* Features */}
            <div className="space-y-3 sm:space-y-4">
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <feature.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${feature.color} flex-shrink-0`} />
                  <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300 min-w-0">{feature.text}</span>
                  <Check className="w-4 h-4 text-green-500 ml-auto flex-shrink-0" />
                </div>
              ))}
            </div>

            {/* Price */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-3 sm:p-4 text-center">
              <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
                $2.999
                <span className="text-base sm:text-lg font-normal text-gray-600 dark:text-gray-400">/mes</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                Cancela cuando quieras
              </p>
            </div>

            {/* Purchase Button */}
            <Button
              onClick={handlePurchasePremium}
              disabled={loading}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0 py-3 touch-manipulation"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm sm:text-base">Procesando...</span>
                </div>
              ) : (
                <>
                  <Crown className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  <span className="text-sm sm:text-base">Obtener Premium</span>
                </>
              )}
            </Button>
          </div>
        )}

        {/* Super Likes Tab */}
        {activeTab === 'superlikes' && (
          <div className="space-y-3 sm:space-y-4">
            <p className="text-center text-gray-600 dark:text-gray-400 text-xs sm:text-sm mb-4 sm:mb-6">
              Los Super Likes aumentan 3x tus posibilidades de hacer match
            </p>

            {superLikePackages.map((pkg, index) => (
              <div
                key={index}
                className={`relative border rounded-lg p-3 sm:p-4 ${
                  pkg.popular
                    ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {pkg.popular && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      Más Popular
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      {Array.from({ length: Math.min(pkg.amount, 5) }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 fill-yellow-500" />
                      ))}
                      {pkg.amount > 5 && (
                        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                          +{pkg.amount - 5}
                        </span>
                      )}
                    </div>
                    <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100 truncate">
                      <span className="hidden sm:inline">{pkg.amount} Super Likes</span>
                      <span className="sm:hidden">{pkg.amount} Likes</span>
                    </span>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-sm sm:text-base text-gray-900 dark:text-gray-100">
                      ${pkg.price}
                    </div>
                    <Button
                      onClick={() => handlePurchaseSuperLikes(pkg.amount)}
                      disabled={loading}
                      size="sm"
                      className="mt-1 bg-yellow-500 hover:bg-yellow-600 text-white border-0 text-xs sm:text-sm touch-manipulation"
                    >
                      Comprar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Pagos seguros procesados por MercadoPago
          </p>
        </div>
      </div>
    </Modal>
  );
}