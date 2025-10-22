'use client';

import React from 'react';
import { User } from '@/types';
import { Avatar, Badge, Card } from '@/components/ui';
import { Skeleton, SkeletonText, SkeletonAvatar } from '@/components/ui/Skeleton';
import { VerificationBadge } from '@/components/verification';
import { cn, calculateAge } from '@/lib/utils';
import { formatDistance } from '@/lib/geolocation';
import { getUserProfilePhoto, getUserAllPhotos } from '@/lib/userUtils';
import { MapPin, Heart, X, Star, Shield } from 'lucide-react';
import SexualRoleIcon from '@/components/ui/SexualRoleIcon';

export interface UserCardProps {
  user: User;
  distance?: number;
  showActions?: boolean;
  onLike?: () => void;
  onPass?: () => void;
  onSuperLike?: () => void;
  onProfileClick?: () => void;
  className?: string;
  compact?: boolean;
}

// Skeleton loading component for UserCard
export const UserCardSkeleton: React.FC<{ 
  compact?: boolean; 
  showActions?: boolean; 
  className?: string; 
}> = ({ compact = false, showActions = false, className }) => {
  if (compact) {
    return (
      <Card className={cn('p-3 sm:p-4 animate-pulse', className)}>
        <div className="flex items-center space-x-3">
          <SkeletonAvatar size="md" />
          <div className="flex-1 space-y-2">
            <Skeleton height={16} width="60%" />
            <Skeleton height={14} width="40%" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden animate-pulse', className)}>
      {/* Photo skeleton */}
      <div className="relative">
        <Skeleton height={400} className="w-full" />
        
        {/* Premium badge skeleton */}
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
          <Skeleton width={80} height={24} className="rounded-full" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton height={24} width="60%" />
            <div className="flex items-center space-x-2">
              <Skeleton width={16} height={16} />
              <Skeleton height={16} width="40%" />
            </div>
          </div>
        </div>

        <SkeletonText lines={2} />

        {/* Interests skeleton */}
        <div className="flex flex-wrap gap-1 sm:gap-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} height={24} width={60} className="rounded-full" />
          ))}
        </div>

        {/* Actions skeleton */}
        {showActions && (
          <div className="flex justify-center space-x-3 sm:space-x-4 pt-3 sm:pt-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} width={48} height={48} variant="circular" />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export const UserCard: React.FC<UserCardProps> = ({
  user,
  distance,
  showActions = false,
  onLike,
  onPass,
  onSuperLike,
  onProfileClick,
  className,
  compact = false
}) => {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(true);

  const age = user.age || null;
  const profilePhoto = getUserProfilePhoto(user);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLike?.();
  };

  const handlePass = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPass?.();
  };

  const handleSuperLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSuperLike?.();
  };

  const handleCardClick = () => {
    onProfileClick?.();
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  if (compact) {
    return (
      <Card 
        className={cn(
          'w-full max-w-xs mx-auto bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-200 dark:border-gray-700 rounded-2xl',
          className
        )}
        onClick={handleCardClick}
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl">
          {profilePhoto && !imageError ? (
            <>
              {imageLoading && (
                <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-orange-100 dark:from-purple-900/30 dark:to-orange-900/30 animate-pulse" />
              )}
              <img
                src={profilePhoto}
                alt={user.name}
                className="w-full h-full object-cover"
                onError={handleImageError}
                onLoad={handleImageLoad}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-orange-100 dark:from-purple-900/30 dark:to-orange-900/30">
              <div className="text-center">
                <div className="w-16 h-16 bg-white/50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">👤</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Sin foto</p>
              </div>
            </div>
          )}

          {/* Elegant overlay with minimal info */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4">
            <div className="text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <h3 className="text-lg font-bold truncate">{user.name}</h3>
                  {user.sexualRole && (
                    <SexualRoleIcon 
                      role={user.sexualRole as 'active' | 'passive' | 'versatile'} 
                      size="md"
                    />
                  )}
                </div>
                {age && (
                  <span className="text-lg font-semibold opacity-90 ml-2">{age}</span>
                )}
              </div>
              {distance !== undefined && (
                <div className="flex items-center mt-1 opacity-80">
                  <MapPin className="w-3 h-3 mr-1" />
                  <span className="text-sm">{formatDistance(distance)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status indicators - more elegant positioning */}
          {user.isOnline && (
            <div className="absolute top-3 right-3">
              <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
            </div>
          )}

          {user.isPremium && (
            <div className="absolute top-3 left-3">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg flex items-center backdrop-blur-sm">
                <Star className="w-3 h-3 mr-1" />
                PRO
              </div>
            </div>
          )}

          {user.isVerified && (
            <div className="absolute top-3 left-3" style={{ marginTop: user.isPremium ? '2rem' : '0' }}>
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg flex items-center backdrop-blur-sm">
                <Shield className="w-3 h-3 mr-1" />
                ✓
              </div>
            </div>
          )}

          {/* Photo count indicator */}
          {getUserAllPhotos(user).length > 1 && (
            <div className="absolute bottom-3 right-3">
              <div className="bg-black/50 text-white px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                {getUserAllPhotos(user).length}
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        'overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700',
        'w-full max-w-[120px] sm:max-w-[280px] md:max-w-md rounded-lg sm:rounded-xl md:rounded-2xl shadow-sm sm:shadow-md md:shadow-lg',
        className
      )}
      onClick={handleCardClick}
    >
      {/* Photo section */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-t-xl sm:rounded-t-2xl">
        {getUserAllPhotos(user).length > 0 ? (
          <img
            src={getUserProfilePhoto(user) || ''}
            alt={user.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-orange-100 dark:from-purple-900/30 dark:to-orange-900/30">
            <div className="text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
                <span className="text-2xl sm:text-3xl flex items-center justify-center">👤</span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center">Sin foto de perfil</p>
            </div>
          </div>
        )}

        {/* Online indicator */}
        {user.isOnline && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
          </div>
        )}

        {/* Premium badge */}
        {user.isPremium && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
            <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium shadow-lg backdrop-blur-sm border border-white/20 flex items-center">
              <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 flex-shrink-0" />
              <span className="hidden sm:inline">Premium</span>
              <span className="sm:hidden">Pro</span>
            </div>
          </div>
        )}

        {/* Verified badge */}
        {user.isVerified && (
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3" style={{ marginTop: user.isPremium ? '1.5rem' : '0' }}>
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium shadow-lg backdrop-blur-sm border border-white/20 flex items-center">
              <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 flex-shrink-0" />
              <span className="hidden sm:inline">Verificado</span>
              <span className="sm:hidden">✓</span>
            </div>
          </div>
        )}

        {/* Photo indicators */}
        {getUserAllPhotos(user).length > 1 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-0.5 sm:space-x-1">
            {getUserAllPhotos(user).map((_, index) => (
              <div
                key={index}
                className={cn(
                  'w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shadow-lg',
                  index === 0 ? 'bg-white' : 'bg-white/50'
                )}
              />
            ))}
          </div>
        )}
      </div>

      {/* User Info */}
      <div className="p-1 sm:p-2 md:p-4">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2 md:mb-3">
          <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm md:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
              {user.name}
            </h3>
            {user.sexualRole && (
              <SexualRoleIcon 
                role={user.sexualRole as 'active' | 'passive' | 'versatile'} 
                size="md"
              />
            )}
            <VerificationBadge 
              verificationLevel={user.verificationLevel || 'basic'} 
              size="sm" 
              showText={false}
              className="flex-shrink-0"
            />
            <span className="text-gray-500 dark:text-gray-400 font-medium text-xs sm:text-sm md:text-base flex-shrink-0">
              {age || user.age || 0}
            </span>
          </div>
          {distance !== undefined && (
            <div className="flex items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 flex-shrink-0 ml-1 sm:ml-2">
              <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 md:w-4 md:h-4 mr-0.5 sm:mr-1" />
              <span className="whitespace-nowrap">{formatDistance(distance)}</span>
            </div>
          )}
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-3 line-clamp-2 leading-relaxed">
            {user.bio}
          </p>
        )}

        {/* Interests */}
        {user.interests && user.interests.length > 0 && (
          <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-3">
            {user.interests.slice(0, 2).map((interest, index) => (
              <span key={index} className="bg-gradient-to-r from-purple-100 to-orange-100 dark:from-purple-900/30 dark:to-orange-900/30 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium border border-purple-200 dark:border-purple-600 shadow-sm">
                {interest}
              </span>
            ))}
            {user.interests.length > 2 && (
              <span className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium border border-gray-200 dark:border-gray-600 shadow-sm">
                +{user.interests.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Last seen */}
        {user.lastSeen && !user.isOnline && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Visto hace {new Date(user.lastSeen.toDate()).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Action buttons */}
      {showActions && (
        <div className="p-2 sm:p-3 md:p-4 pt-0">
          <div className="flex justify-center space-x-2 sm:space-x-3 md:space-x-4">
            <button
              onClick={handlePass}
              className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors shadow-md hover:shadow-lg touch-manipulation"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-600 dark:text-gray-300" />
            </button>
            
            <button
              onClick={handleSuperLike}
              className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg touch-manipulation"
            >
              <Star className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </button>
            
            <button
              onClick={handleLike}
              className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg touch-manipulation"
            >
              <Heart className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" />
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default UserCard;