'use client';

import React, { useState } from 'react';
import { Heart, MessageCircle, Star, Ban, MapPin, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserDistance } from '@/types';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getUserProfilePhoto } from '@/lib/userUtils';
import SexualRoleIcon from '@/components/ui/SexualRoleIcon';
import UserDetailModal from './UserDetailModal';

interface ProfileGridProps {
  users: UserDistance[];
  onLike?: (userId: string) => Promise<void>;
  onSuperLike?: (userId: string) => Promise<void>;
  onBlock?: (userId: string) => Promise<void>;
  onStartChat?: (userId: string) => Promise<void>;
  className?: string;
  userSuperLikes?: number;
  userIsPremium?: boolean;
  onShowPremiumModal?: () => void;
}

interface ProfileCardProps {
  userDistance: UserDistance;
  onLike?: (userId: string) => Promise<void>;
  onSuperLike?: (userId: string) => Promise<void>;
  onBlock?: (userId: string) => Promise<void>;
  onStartChat?: (userId: string) => Promise<void>;
  onClick?: () => void;
  userSuperLikes?: number;
  userIsPremium?: boolean;
  onShowPremiumModal?: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  userDistance,
  onLike,
  onSuperLike,
  onBlock,
  onStartChat,
  onClick,
  userSuperLikes = 0,
  userIsPremium = false,
  onShowPremiumModal
}) => {
  const { user, distance } = userDistance;
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const getDisplayAge = () => {
    return user.age ? `${user.age}` : '';
  };

  const handleAction = async (e: React.MouseEvent, action: () => Promise<void>, actionType?: string) => {
    e.stopPropagation();
    console.log('🔥 ProfileCard: handleAction called', { userId: user.id, action: action.name, actionType });
    
    // Verificar créditos para super like
    if (actionType === 'superlike' && !userIsPremium && userSuperLikes <= 0) {
      console.log('⚠️ ProfileCard: No hay créditos de super like disponibles');
      onShowPremiumModal?.();
      return;
    }
    
    setIsLoading(true);
    try {
      await action();
      console.log('✅ ProfileCard: action completed successfully');
    } catch (error) {
      console.error('❌ ProfileCard: Error en acción:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div
        className={cn(
          "relative bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden cursor-pointer",
          "transform transition-all duration-200 hover:shadow-lg active:scale-95",
          "aspect-[3/5] sm:aspect-[3/4]" // Hacer las cards más altas en móviles
        )}
        onClick={() => setShowModal(true)}
      >
        {/* Profile Image - Ocupa toda la card */}
        <div className="relative w-full h-full overflow-hidden">
          {getUserProfilePhoto(user) ? (
            <Image
              src={getUserProfilePhoto(user) || ''}
              alt={user.name}
              fill
              className="object-cover"
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageLoaded(false)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center">
              <div className="text-gray-500 dark:text-gray-400 text-2xl sm:text-3xl">👤</div>
            </div>
          )}
          
          {/* Loading skeleton */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Action buttons en las esquinas */}
          {/* Like - Esquina superior izquierda */}
          <button
            onClick={(e) => handleAction(e, async () => await onLike?.(user.id), 'like')}
            disabled={isLoading}
            className={cn(
              "absolute top-2 left-2 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-pink-500/80 hover:bg-pink-500 text-white rounded-full",
              "flex items-center justify-center transition-all duration-200 backdrop-blur-sm",
              "shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
            title="Like"
          >
            <Heart size={12} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
          </button>

          {/* Chat - Esquina superior derecha */}
          <button
            onClick={(e) => handleAction(e, async () => await onStartChat?.(user.id), 'chat')}
            disabled={isLoading}
            className={cn(
              "absolute top-2 right-2 w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 bg-blue-500/80 hover:bg-blue-500 text-white rounded-full",
              "flex items-center justify-center transition-all duration-200 backdrop-blur-sm",
              "shadow-lg hover:shadow-xl transform hover:scale-110 active:scale-95",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
            title="Chat"
          >
            <MessageCircle size={12} className="sm:w-4 sm:h-4 md:w-5 md:h-5" />
          </button>

          {/* Premium badge */}
          {user.isPremium && (
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-2 py-0.5 rounded-full text-xs font-semibold shadow-lg">
              PREMIUM
            </div>
          )}

          {/* Online indicator */}
          {user.isOnline && (
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 translate-y-6 w-2 h-2 bg-green-500 rounded-full border border-white shadow-lg"></div>
          )}

          {/* User info overlay - Solo información básica */}
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-2 text-white">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 mb-1">
                <h3 className="font-semibold text-base sm:text-sm truncate max-w-[120px] sm:max-w-[80px]">
                  {user.name || 'Usuario'}
                </h3>
                {user.sexualRole && (
                  <SexualRoleIcon 
                    role={user.sexualRole as 'active' | 'passive' | 'versatile'} 
                    size="sm"
                    className="text-white"
                  />
                )}
                <span className="text-sm sm:text-xs font-medium">
                  {getDisplayAge()}
                </span>
              </div>
              
              {/* Distance */}
              <div className="flex items-center justify-center text-sm sm:text-xs text-white/80">
                <MapPin size={12} className="sm:w-2.5 sm:h-2.5 mr-1" />
                <span>{Math.round(distance)} km</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal */}
      <UserDetailModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        userDistance={userDistance}
        onLike={onLike}
        onSuperLike={onSuperLike}
        onBlock={onBlock}
        onStartChat={onStartChat}
        userSuperLikes={userSuperLikes}
        userIsPremium={userIsPremium}
        onShowPremiumModal={onShowPremiumModal}
      />
    </>
  );
};

export const ProfileGrid: React.FC<ProfileGridProps> = ({
  users,
  onLike,
  onSuperLike,
  onBlock,
  onStartChat,
  className,
  userSuperLikes = 0,
  userIsPremium = false,
  onShowPremiumModal
}) => {
  const router = useRouter();

  const handleProfileClick = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No hay usuarios cerca
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-sm">
          Intenta ajustar tus filtros o ampliar tu radio de búsqueda para encontrar más personas.
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-3 md:gap-4",
      className
    )}>
      {users.map((userDistance) => (
        <ProfileCard
          key={userDistance.user.id}
          userDistance={userDistance}
          onLike={onLike}
          onSuperLike={onSuperLike}
          onBlock={onBlock}
          onStartChat={onStartChat}
          onClick={() => handleProfileClick(userDistance.user.id)}
          userSuperLikes={userSuperLikes}
          userIsPremium={userIsPremium}
          onShowPremiumModal={onShowPremiumModal}
        />
      ))}
    </div>
  );
};

export default ProfileGrid;