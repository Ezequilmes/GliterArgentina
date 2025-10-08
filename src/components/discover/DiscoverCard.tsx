'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Badge, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { getUserAllPhotos } from '@/lib/userUtils';
import { User } from '@/types';
import { Timestamp } from 'firebase/firestore';
import SexualRoleIcon from '@/components/ui/SexualRoleIcon';
import {
  Heart,
  X,
  Star,
  MapPin,
  Info,
  ChevronLeft,
  ChevronRight,
  Crown,
  Shield
} from 'lucide-react';

interface DiscoverCardUser extends User {
  distance?: number;
}

interface DiscoverCardProps {
  user: DiscoverCardUser;
  onLike?: (userId: string) => void;
  onPass?: (userId: string) => void;
  onSuperLike?: (userId: string) => void;
  onShowProfile?: (userId: string) => void;
  className?: string;
  showActions?: boolean;
}

export const DiscoverCard: React.FC<DiscoverCardProps> = ({
  user,
  onLike,
  onPass,
  onSuperLike,
  onShowProfile,
  className,
  showActions = true
}) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Get all photos using utility function
  const allPhotos = getUserAllPhotos(user);

  const handlePrevPhoto = () => {
    setCurrentPhotoIndex((prev) => 
      prev === 0 ? allPhotos.length - 1 : prev - 1
    );
  };

  const handleNextPhoto = () => {
    setCurrentPhotoIndex((prev) => 
      prev === allPhotos.length - 1 ? 0 : prev + 1
    );
  };

  const handleAction = async (action: () => void) => {
    setIsLoading(true);
    try {
      await action();
    } finally {
      setIsLoading(false);
    }
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return null;
    if (distance < 1) return 'Menos de 1 km';
    return `${Math.round(distance)} km`;
  };

  const formatLastSeen = (lastSeen?: Timestamp) => {
    if (!lastSeen) return null;
    const now = new Date();
    const lastSeenDate = lastSeen.toDate();
    const diff = now.getTime() - lastSeenDate.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return 'Activo hace menos de 1 hora';
    if (hours < 24) return `Activo hace ${hours} hora${hours > 1 ? 's' : ''}`;
    if (days < 7) return `Activo hace ${days} día${days > 1 ? 's' : ''}`;
    return 'Activo hace más de una semana';
  };

  const getSexualRoleColor = (role?: string) => {
    switch (role) {
      case 'active': return 'bg-red-500';
      case 'passive': return 'bg-blue-500';
      case 'versatile': return 'bg-accent-500';
      default: return 'bg-gray-500';
    }
  };

  const getSexualRoleLabel = (role?: string) => {
    switch (role) {
      case 'active': return 'Activo';
      case 'passive': return 'Pasivo';
      case 'versatile': return 'Versátil';
      default: return '';
    }
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        'relative w-full max-w-xs sm:max-w-sm mx-auto',
        'bg-gradient-to-br from-white via-white to-primary/5',
      'dark:from-gray-900 dark:via-gray-900 dark:to-primary/10',
      'rounded-2xl sm:rounded-3xl shadow-2xl shadow-primary/10 overflow-hidden',
        'border border-white/20 dark:border-gray-800/50',
        'backdrop-blur-sm',
        'transform transition-all duration-500 ease-out',
        'hover:scale-[1.02] hover:shadow-3xl hover:shadow-primary/20',
        'hover:border-primary/30 dark:hover:border-primary/30',
        'group cursor-pointer',
        isLoading && 'pointer-events-none opacity-75',
        className
      )}
    >
      {/* Photo Section */}
      <div 
        className="relative aspect-[3/4] overflow-hidden rounded-t-2xl sm:rounded-t-3xl cursor-pointer"
        onClick={() => onShowProfile?.(user.id)}
      >
        {allPhotos.length > 0 && (
          <>
            <Image
              src={allPhotos[currentPhotoIndex]}
              alt={`${user.name} - Foto ${currentPhotoIndex + 1}`}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={currentPhotoIndex === 0}
            />
            
            {/* Photo Navigation */}
            {allPhotos.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrevPhoto();
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 
                           bg-gradient-to-r from-black/60 to-black/40 backdrop-blur-sm
                           rounded-full flex items-center justify-center text-white 
                           hover:from-purple-600/80 hover:to-orange-600/80 
                           transition-all duration-300 hover:scale-110 active:scale-95
                           shadow-lg hover:shadow-xl hover:shadow-purple-500/25
                           opacity-0 group-hover:opacity-100 group-hover:translate-x-0
                           -translate-x-2 border border-white/20"
                >
                  <ChevronLeft className="w-5 h-5 transition-transform duration-300 hover:-translate-x-0.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextPhoto();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 
                           bg-gradient-to-r from-black/60 to-black/40 backdrop-blur-sm
                           rounded-full flex items-center justify-center text-white 
                           hover:from-purple-600/80 hover:to-orange-600/80 
                           transition-all duration-300 hover:scale-110 active:scale-95
                           shadow-lg hover:shadow-xl hover:shadow-purple-500/25
                           opacity-0 group-hover:opacity-100 group-hover:translate-x-0
                           translate-x-2 border border-white/20"
                >
                  <ChevronRight className="w-5 h-5 transition-transform duration-300 hover:translate-x-0.5" />
                </button>
                
                {/* Photo Indicators */}
                <div className="absolute top-4 left-1/2 -translate-x-1/2 flex space-x-2 
                              animate-in fade-in-0 slide-in-from-top-2 duration-500 delay-100">
                  {allPhotos.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        'h-1 rounded-full transition-all duration-500 cursor-pointer',
                        index === currentPhotoIndex
                          ? 'w-8 bg-gradient-to-r from-purple-400 to-orange-400 shadow-lg shadow-purple-500/50 animate-pulse'
                          : 'w-4 bg-white/60 hover:bg-white/80 hover:w-6 hover:shadow-md'
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentPhotoIndex(index);
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Status Badges */}
        <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10 animate-in fade-in-0 slide-in-from-left-4 duration-500 delay-200">
          {user.isOnline && (
            <div className="px-3 py-1 bg-gradient-to-r from-green-400 to-emerald-500 
                          backdrop-blur-sm rounded-full text-white text-xs font-medium 
                          shadow-lg border border-white/20 flex items-center
                          hover:shadow-xl hover:shadow-green-500/25 transition-all duration-300 hover:scale-105">
              <div className="w-2 h-2 bg-white rounded-full mr-2 animate-pulse" />
              En línea
            </div>
          )}
          {user.isPremium && (
            <div className="px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 
                          backdrop-blur-sm rounded-full text-white text-xs font-medium 
                          shadow-lg border border-white/20 flex items-center
                          hover:shadow-xl hover:shadow-yellow-500/25 transition-all duration-300 hover:scale-105">
              <Crown className="w-3 h-3 mr-1 animate-pulse" />
              Premium
            </div>
          )}
          {user.isVerified && (
            <div className="px-3 py-1 bg-gradient-to-r from-purple-500 to-blue-500 
                          backdrop-blur-sm rounded-full text-white text-xs font-medium 
                          shadow-lg border border-white/20 flex items-center
                          hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105">
              <Shield className="w-3 h-3 mr-1" />
              Verificado
            </div>
          )}
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t 
                      from-black/90 via-black/60 to-transparent transition-opacity duration-300" />
        
        {/* User Info Overlay */}
        <div className="absolute bottom-4 left-4 right-4 text-white animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-white/90 
                             bg-clip-text text-transparent drop-shadow-lg
                             hover:from-orange-200 hover:to-purple-200 transition-all duration-300">
                  {user.name}{user.age ? `, ${user.age}` : ''}
                </h3>
                {user.sexualRole && (
                  <SexualRoleIcon 
                    role={user.sexualRole as 'active' | 'passive' | 'versatile'} 
                    size="md"
                    className="drop-shadow-lg"
                  />
                )}
              </div>
              {user.distance && (
                <div className="flex items-center text-sm text-white/90 mt-1 
                              hover:text-white transition-colors duration-300">
                  <MapPin className="w-4 h-4 mr-1 text-orange-400 animate-pulse" />
                  {formatDistance(user.distance)}
                </div>
              )}
            </div>
            
            {onShowProfile && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShowProfile(user.id);
                }}
                className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full 
                         flex items-center justify-center text-white 
                         hover:bg-gradient-to-r hover:from-purple-500/80 hover:to-orange-500/80 
                         transition-all duration-300 hover:scale-110 active:scale-95
                         shadow-lg border border-white/20 hover:shadow-xl hover:shadow-purple-500/25
                         group overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-orange-500 
                              opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
                <Info className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
              </button>
            )}
          </div>

          {/* Interests */}
          {user.interests && user.interests.length > 0 && (
            <div className="flex flex-wrap gap-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-500">
              {user.interests.slice(0, 3).map((interest, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full 
                           text-xs text-white border border-white/20
                           hover:bg-white/30 hover:scale-105 transition-all duration-300
                           hover:shadow-lg hover:shadow-white/25"
                  style={{ animationDelay: `${600 + index * 100}ms` }}
                >
                  {interest}
                </span>
              ))}
              {user.interests.length > 3 && (
                <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full 
                               text-xs text-white border border-white/20
                               hover:bg-white/30 hover:scale-105 transition-all duration-300
                               hover:shadow-lg hover:shadow-white/25">
                  +{user.interests.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Sexual Role */}
          {user.sexualRole && (
            <div className="flex items-center mb-1 sm:mb-2">
              <div className={cn(
                'w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full mr-1.5 sm:mr-2 shadow-lg flex-shrink-0',
                getSexualRoleColor(user.sexualRole)
              )} />
              <span className="text-xs sm:text-sm text-white/95 font-medium truncate">
                {getSexualRoleLabel(user.sexualRole)}
              </span>
            </div>
          )}

          {/* Last Seen */}
          {!user.isOnline && user.lastSeen && (
            <p className="text-xs text-white/80 font-medium truncate">
              {formatLastSeen(user.lastSeen)}
            </p>
          )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-3 sm:p-4 md:p-6 bg-gradient-to-b from-transparent to-white/50 dark:to-gray-900/50 
                    backdrop-blur-sm">
        {/* Bio */}
        {user.bio && (
          <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm 
                        rounded-xl sm:rounded-2xl border border-white/20 dark:border-gray-700/30 shadow-sm">
            <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-200 line-clamp-3 leading-relaxed">
              {user.bio}
            </p>
          </div>
        )}

        {/* Interests */}
        {user.interests && user.interests.length > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6">
            {user.interests.slice(0, 6).map((interest, index) => (
              <span
                key={index}
                className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-purple-100 to-orange-100 
                         dark:from-purple-900/40 dark:to-orange-900/40 
                         text-purple-700 dark:text-purple-300 text-xs font-medium 
                         rounded-full border border-purple-200/50 dark:border-purple-700/50 
                         backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 
                         hover:scale-105 truncate max-w-[80px] sm:max-w-none"
              >
                {interest}
              </span>
            ))}
            {user.interests.length > 6 && (
              <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gradient-to-r from-gray-100 to-gray-200 
                             dark:from-gray-800 dark:to-gray-700 
                             text-gray-600 dark:text-gray-300 text-xs font-medium 
                             rounded-full border border-gray-200/50 dark:border-gray-600/50 
                             backdrop-blur-sm shadow-sm flex-shrink-0">
                +{user.interests.length - 6}
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex items-center justify-center space-x-3 sm:space-x-4 md:space-x-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-300">
            {onPass && (
              <button
                onClick={() => handleAction(() => onPass(user.id))}
                disabled={isLoading}
                className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-red-50 to-red-100 
                         dark:from-red-900/20 dark:to-red-800/20 
                         border-2 border-red-200 dark:border-red-700/50 
                         text-red-500 dark:text-red-400 
                         hover:from-red-500 hover:to-red-600 hover:text-white 
                         hover:border-red-500 hover:shadow-xl hover:shadow-red-500/30 
                         transition-all duration-300 hover:scale-110 active:scale-95
                         backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed 
                         flex items-center justify-center group overflow-hidden
                         before:absolute before:inset-0 before:bg-gradient-to-r before:from-red-500/0 before:to-pink-500/0
                         before:transition-all before:duration-300 hover:before:from-red-500/10 hover:before:to-pink-500/10
                         touch-manipulation"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 transition-all duration-300 group-hover:scale-110 group-hover:rotate-90 relative z-10" />
                <div className="absolute inset-0 rounded-full bg-red-500/0 group-hover:bg-red-500/5 transition-all duration-300" />
              </button>
            )}

            {onSuperLike && (
              <button
                onClick={() => handleAction(() => onSuperLike(user.id))}
                disabled={isLoading}
                className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 
                         dark:from-blue-900/20 dark:to-blue-800/20 
                         border-2 border-blue-200 dark:border-blue-700/50 
                         text-blue-500 dark:text-blue-400 
                         hover:from-blue-500 hover:to-blue-600 hover:text-white 
                         hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/30 
                         transition-all duration-300 hover:scale-110 active:scale-95
                         backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed 
                         flex items-center justify-center group overflow-hidden
                         before:absolute before:inset-0 before:bg-gradient-to-r before:from-blue-500/0 before:to-cyan-500/0
                         before:transition-all before:duration-300 hover:before:from-blue-500/10 hover:before:to-cyan-500/10
                         touch-manipulation"
              >
                <Star className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 relative z-10" />
                <div className="absolute inset-0 rounded-full bg-blue-500/0 group-hover:bg-blue-500/5 transition-all duration-300" />
                {/* Sparkle effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 bg-white rounded-full animate-ping"
                      style={{
                        top: `${20 + i * 20}%`,
                        left: `${30 + i * 15}%`,
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
              </button>
            )}

            {onLike && (
              <button
                onClick={() => handleAction(() => onLike(user.id))}
                disabled={isLoading}
                className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-green-50 to-emerald-100 
                         dark:from-green-900/20 dark:to-emerald-800/20 
                         border-2 border-green-200 dark:border-green-700/50 
                         text-green-500 dark:text-green-400 
                         hover:from-green-500 hover:to-emerald-600 hover:text-white 
                         hover:border-green-500 hover:shadow-xl hover:shadow-green-500/30 
                         transition-all duration-300 hover:scale-110 active:scale-95
                         backdrop-blur-sm disabled:opacity-50 disabled:cursor-not-allowed 
                         flex items-center justify-center group overflow-hidden
                         before:absolute before:inset-0 before:bg-gradient-to-r before:from-green-500/0 before:to-emerald-500/0
                         before:transition-all before:duration-300 hover:before:from-green-500/10 hover:before:to-emerald-500/10
                         touch-manipulation"
              >
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 transition-all duration-300 group-hover:scale-110 group-hover:fill-current relative z-10" />
                <div className="absolute inset-0 rounded-full bg-green-500/0 group-hover:bg-green-500/5 transition-all duration-300" />
                {/* Heart pulse effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute inset-2 border-2 border-white/30 rounded-full animate-ping" />
                </div>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiscoverCard;