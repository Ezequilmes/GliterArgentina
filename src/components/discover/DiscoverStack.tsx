'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DiscoverCard } from './DiscoverCard';
import { Button, Loading } from '@/components/ui';
import RippleButton from '@/components/ui/RippleButton';
import { cn } from '@/lib/utils';
import { Heart, X, Star, RotateCcw, RefreshCw } from 'lucide-react';
import type { UserDistance } from '@/types';

interface DiscoverStackProps {
  users: UserDistance[];
  onLike?: (userId: string) => void;
  onPass?: (userId: string) => void;
  onSuperLike?: (userId: string) => void;
  onShowProfile?: (userId: string) => void;
  onLoadMore?: () => void;
  isLoading?: boolean;
  hasMore?: boolean;
  className?: string;
  userSuperLikes?: number;
  userIsPremium?: boolean;
  onShowPremiumModal?: () => void;
}

export const DiscoverStack: React.FC<DiscoverStackProps> = ({
  users,
  onLike,
  onPass,
  onSuperLike,
  onShowProfile,
  onLoadMore,
  isLoading = false,
  hasMore = true,
  className,
  userSuperLikes = 0,
  userIsPremium = false,
  onShowPremiumModal
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastAction, setLastAction] = useState<{
    type: 'like' | 'pass' | 'superlike';
    userDistance: UserDistance;
  } | null>(null);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const startPos = useRef({ x: 0, y: 0 });

  const currentUserDistance = users[currentIndex];
  const nextUserDistance = users[currentIndex + 1];

  // Load more users when getting close to the end
  useEffect(() => {
    if (currentIndex >= users.length - 3 && hasMore && onLoadMore && !isLoading) {
      onLoadMore();
    }
  }, [currentIndex, users.length, hasMore, onLoadMore, isLoading]);

  const handleAction = (action: 'like' | 'pass' | 'superlike', userDistance: UserDistance) => {
    // Verificar créditos de super likes antes de ejecutar
    if (action === 'superlike') {
      if (!userIsPremium && userSuperLikes <= 0) {
        // Mostrar modal premium si no hay créditos
        onShowPremiumModal?.();
        return;
      }
    }

    setLastAction({ type: action, userDistance });
    
    // Call the appropriate callback
    switch (action) {
      case 'like':
        onLike?.(userDistance.user.id);
        break;
      case 'pass':
        onPass?.(userDistance.user.id);
        break;
      case 'superlike':
        onSuperLike?.(userDistance.user.id);
        break;
    }

    // Move to next card
    setCurrentIndex(prev => prev + 1);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleUndo = () => {
    if (lastAction && currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setLastAction(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!currentUserDistance) return;
    
    setIsDragging(true);
    startPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !currentUserDistance) return;

    const deltaX = e.clientX - startPos.current.x;
    const deltaY = e.clientY - startPos.current.y;
    
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleDragEnd = () => {
    const { x, y } = dragOffset;
    const threshold = 100;

    if (y < -threshold) {
      handleAction('superlike', currentUserDistance);
    } else if (x > threshold) {
      handleAction('like', currentUserDistance);
    } else if (x < -threshold) {
      handleAction('pass', currentUserDistance);
    } else {
      // Snap back to center
      setDragOffset({ x: 0, y: 0 });
    }

    setIsDragging(false);
  };

  const handleMouseUp = () => {
    if (!isDragging || !currentUserDistance) return;
    handleDragEnd();
  };

  // Touch event handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!currentUserDistance) return;
    
    setIsDragging(true);
    const touch = e.touches[0];
    startPos.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !currentUserDistance) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startPos.current.x;
    const deltaY = touch.clientY - startPos.current.y;
    
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleTouchEnd = () => {
    if (!isDragging || !currentUserDistance) return;
    handleDragEnd();
  };

  const getCardTransform = (index: number) => {
    if (index === currentIndex) {
      const rotation = dragOffset.x * 0.1;
      return `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`;
    }
    if (index === currentIndex + 1) {
      return 'scale(0.95) translateY(10px)';
    }
    if (index === currentIndex + 2) {
      return 'scale(0.9) translateY(20px)';
    }
    return 'scale(0.85) translateY(30px)';
  };

  const getCardOpacity = (index: number) => {
    if (index === currentIndex) return 1;
    if (index === currentIndex + 1) return 0.8;
    if (index === currentIndex + 2) return 0.6;
    return 0.4;
  };

  const getSwipeIndicator = () => {
    const { x, y } = dragOffset;
    const threshold = 50;

    if (y < -threshold) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-500/20 rounded-2xl">
          <div className="bg-blue-500 text-white px-4 py-2 rounded-full font-semibold flex items-center">
            <Star className="w-5 h-5 mr-2" />
            SUPER LIKE
          </div>
        </div>
      );
    }
    
    if (x > threshold) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-green-500/20 rounded-2xl">
          <div className="bg-green-500 text-white px-4 py-2 rounded-full font-semibold flex items-center">
            <Heart className="w-5 h-5 mr-2" />
            LIKE
          </div>
        </div>
      );
    }
    
    if (x < -threshold) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/20 rounded-2xl">
          <div className="bg-red-500 text-white px-4 py-2 rounded-full font-semibold flex items-center">
            <X className="w-5 h-5 mr-2" />
            PASS
          </div>
        </div>
      );
    }

    return null;
  };

  if (users.length === 0 && !isLoading) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <Heart className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No hay más personas por descubrir
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Vuelve más tarde para ver nuevos perfiles
          </p>
          {lastAction && (
            <Button
              variant="outline"
              onClick={handleUndo}
              className="mb-4"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Deshacer última acción
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (currentIndex >= users.length) {
      return (
        <div className={cn('flex flex-col items-center justify-center py-12 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl shadow-lg', className)}>
          <div className="relative flex items-center justify-center mb-6">
            <Heart className="w-16 h-16 text-red-500 animate-heartbeat" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 border-4 border-red-300 dark:border-red-700 rounded-full animate-spin-slow" style={{ borderTopColor: 'transparent' }}></div>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 animate-pulse-fast">
            Cargando más perfiles...
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-center max-w-xs mb-6 animate-fade-in-up">
            Buscando nuevas conexiones para ti. ¡La espera valdrá la pena!
          </p>
          <div className="w-full max-w-xs bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4 overflow-hidden">
            <div className="bg-gradient-to-r from-red-400 to-red-600 h-2.5 rounded-full animate-progress-bar"></div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-500 text-center max-w-xs animate-fade-in-up delay-200">
            💡 Consejo: Cuantos más detalles añadas a tu perfil, ¡más fácil será encontrar a tu match ideal!
          </p>
        </div>
      );
    }

  return (
    <div className={cn('w-full max-w-md mx-auto px-4 sm:px-0', className)}>
      {/* Card Stack */}
      <div className="relative h-[500px] sm:h-[600px] md:h-[650px]">
        {users.slice(currentIndex, currentIndex + 3).map((userDistance, index) => {
          const actualIndex = currentIndex + index;
          const isTopCard = index === 0;
          const userWithDistance = {
            ...userDistance.user,
            distance: userDistance.distance
          };
          
          return (
            <div
              key={userDistance.user.id}
              ref={isTopCard ? cardRef : undefined}
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
              style={{
                transform: getCardTransform(actualIndex),
                opacity: getCardOpacity(actualIndex),
                zIndex: 10 - index,
                transition: isDragging && isTopCard ? 'none' : 'all 0.3s ease-out'
              }}
              onMouseDown={isTopCard ? handleMouseDown : undefined}
              onMouseMove={isTopCard ? handleMouseMove : undefined}
              onMouseUp={isTopCard ? handleMouseUp : undefined}
              onMouseLeave={isTopCard ? handleMouseUp : undefined}
              onTouchStart={isTopCard ? handleTouchStart : undefined}
              onTouchMove={isTopCard ? handleTouchMove : undefined}
              onTouchEnd={isTopCard ? handleTouchEnd : undefined}
            >
              <DiscoverCard
                user={userWithDistance}
                onLike={isTopCard ? (userId) => handleAction('like', userDistance) : undefined}
                onPass={isTopCard ? (userId) => handleAction('pass', userDistance) : undefined}
                onSuperLike={isTopCard ? (userId) => handleAction('superlike', userDistance) : undefined}
                onShowProfile={onShowProfile}
                showActions={false}
              />
              
              {/* Swipe Indicator */}
              {isTopCard && isDragging && getSwipeIndicator()}
            </div>
          );
        })}
      </div>

      {/* Action Buttons */}
      {currentUserDistance && (
        <div className="flex items-center justify-center space-x-4 sm:space-x-6 mt-4 sm:mt-6 px-4 sm:px-0 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          <RippleButton
            variant="outline"
            size="lg"
            onClick={() => handleAction('pass', currentUserDistance)}
            rippleColor="rgba(239, 68, 68, 0.3)"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-gray-300 hover:border-red-500 hover:text-red-500 
                     hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 
                     hover:shadow-lg hover:shadow-red-500/25 hover:scale-110 active:scale-95"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200 group-hover:rotate-90" />
          </RippleButton>

          <RippleButton
            variant="outline"
            size="lg"
            onClick={() => handleAction('superlike', currentUserDistance)}
            rippleColor="rgba(59, 130, 246, 0.3)"
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-gray-300 hover:border-blue-500 hover:text-blue-500 
                     hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 
                     hover:shadow-lg hover:shadow-blue-500/25 hover:scale-110 active:scale-95"
          >
            <Star className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-200 group-hover:rotate-12 fill-current" />
          </RippleButton>

          <RippleButton
            variant="outline"
            size="lg"
            onClick={() => handleAction('like', currentUserDistance)}
            rippleColor="rgba(34, 197, 94, 0.3)"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-gray-300 hover:border-green-500 hover:text-green-500 
                     hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-300 
                     hover:shadow-lg hover:shadow-green-500/25 hover:scale-110 active:scale-95"
          >
            <Heart className="w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200 group-hover:scale-110 fill-current" />
          </RippleButton>
        </div>
      )}

      {/* Undo Button */}
      {lastAction && (
        <div className="flex justify-center mt-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          <RippleButton
            variant="ghost"
            size="sm"
            onClick={handleUndo}
            rippleColor="rgba(156, 163, 175, 0.3)"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 
                     hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 
                     hover:scale-105 active:scale-95"
          >
            <RotateCcw className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:-rotate-180" />
            Deshacer
          </RippleButton>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="flex justify-center mt-4">
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Cargando...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscoverStack;