'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Star, Crown } from 'lucide-react';
import { Button } from '@/components/ui';

interface SuperLikeCounterProps {
  onUpgrade?: () => void;
  showUpgradeButton?: boolean;
  className?: string;
}

export function SuperLikeCounter({ 
  onUpgrade, 
  showUpgradeButton = true, 
  className = '' 
}: SuperLikeCounterProps) {
  const { user } = useAuth();
  const [superLikes, setSuperLikes] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    const userRef = doc(db, 'users', user.id);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        const userData = doc.data();
        setSuperLikes(userData.superLikes || 0);
        setIsPremium(userData.isPremium || false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user?.id]);

  if (loading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        <div className="w-8 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Contador de Super Likes */}
      <div className="flex items-center space-x-2">
        <div className="relative">
          <Star 
            className={`w-6 h-6 ${
              superLikes > 0 
                ? 'text-yellow-500 fill-yellow-500' 
                : 'text-gray-400 dark:text-gray-600'
            }`} 
          />
          {isPremium && (
            <Crown className="w-3 h-3 text-yellow-600 absolute -top-1 -right-1" />
          )}
        </div>
        
        <span className={`font-semibold text-sm ${
          superLikes > 0 
            ? 'text-yellow-600 dark:text-yellow-400' 
            : 'text-gray-500 dark:text-gray-400'
        }`}>
          {isPremium ? '∞' : superLikes}
        </span>
      </div>

      {/* Botón de upgrade */}
      {showUpgradeButton && !isPremium && superLikes === 0 && (
        <Button
          onClick={onUpgrade}
          size="sm"
          className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0 text-xs px-3 py-1 h-auto"
        >
          <Crown className="w-3 h-3 mr-1" />
          Obtener más
        </Button>
      )}

      {/* Indicador Premium */}
      {isPremium && (
        <div className="flex items-center space-x-1 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
          <Crown className="w-3 h-3" />
          <span>Premium</span>
        </div>
      )}
    </div>
  );
}