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
        'relative w-full max-w-[280px] sm:max-w-xs md:max-w-sm mx-auto',
        'bg-gradient-to-br from-white via-white to-primary/5',
      'dark:from-gray-900 dark:via-gray-900 dark:to-primary/10',
      'rounded-xl sm:rounded-2xl md:rounded-3xl shadow-lg sm:shadow-2xl shadow-primary/10',
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
        className="relative aspect-[3/4] overflow-hidden rounded-t-xl sm:rounded-t-2xl md:rounded-t-3xl cursor-pointer"
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
                  className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 
                           bg-gradient-to-r from-black/60 to-black/40 backdrop-blur-sm
                           rounded-full flex items-center justify-center text-white 
                           hover:from-purple-600/80 hover:to-orange-600/80 
                           transition-all duration-300 hover:scale-110 active:scale-95
                           shadow-lg hover:shadow-xl hover:shadow-purple-500/25
                           opacity-0 group-hover:opacity-100 group-hover:translate-x-0
                           -translate-x-2 border border-white/20"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 hover:-translate-x-0.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextPhoto();
                  }}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 
                           bg-gradient-to-r from-black/60 to-black/40 backdrop-blur-sm
                           rounded-full flex items-center justify-center text-white 
                           hover:from-purple-600/80 hover:to-orange-600/80 
                           transition-all duration-300 hover:scale-110 active:scale-95
                           shadow-lg hover:shadow-xl hover:shadow-purple-500/25
                           opacity-0 group-hover:opacity-100 group-hover:translate-x-0
                           translate-x-2 border border-white/20"
                >
                  <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 transition-transform duration-300 hover:translate-x-0.5" />
                </button>
                
                {/* Photo Indicators */}
                <div className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 flex space-x-1 sm:space-x-2 
                              animate-in fade-in-0 slide-in-from-top-2 duration-500 delay-100">
                  {allPhotos.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        'h-0.5 sm:h-1 rounded-full transition-all duration-500 cursor-pointer',
                        index === currentPhotoIndex
                          ? 'w-6 sm:w-8 bg-gradient-to-r from-purple-400 to-orange-400 shadow-lg shadow-purple-500/50 animate-pulse'
                          : 'w-3 sm:w-4 bg-white/60 hover:bg-white/80 hover:w-5 sm:hover:w-6 hover:shadow-md'
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
        <div className="absolute top-3 sm:top-4 left-3 sm:left-4 flex flex-wrap gap-1 sm:gap-2 z-10 animate-in fade-in-0 slide-in-from-left-4 duration-500 delay-200">
          {user.isOnline && (
            <div className="px-2 py-0.5 sm:px-3 sm:py-1 bg-gradient-to-r from-green-400 to-emerald-500 
                          backdrop-blur-sm rounded-full text-white text-xs font-medium 
                          shadow-lg border border-white/20 flex items-center
                          hover:shadow-xl hover:shadow-green-500/25 transition-all duration-300 hover:scale-105">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full mr-1 sm:mr-2 animate-pulse" />
              <span className="hidden sm:inline">En línea</span>
              <span className="sm:hidden">Online</span>
            </div>
          )}
          {user.isPremium && (
            <div className="px-2 py-0.5 sm:px-3 sm:py-1 bg-gradient-to-r from-yellow-400 to-orange-500 
                          backdrop-blur-sm rounded-full text-white text-xs font-medium 
                          shadow-lg border border-white/20 flex items-center
                          hover:shadow-xl hover:shadow-yellow-500/25 transition-all duration-300 hover:scale-105">
              <Crown className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1 animate-pulse" />
              <span className="hidden sm:inline">Premium</span>
              <span className="sm:hidden">Pro</span>
            </div>
          )}
          {user.isVerified && (
            <div className="px-2 py-0.5 sm:px-3 sm:py-1 bg-gradient-to-r from-purple-500 to-blue-500 
                          backdrop-blur-sm rounded-full text-white text-xs font-medium 
                          shadow-lg border border-white/20 flex items-center
                          hover:shadow-xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105">
              <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
              <span className="hidden sm:inline">Verificado</span>
              <span className="sm:hidden">✓</span>
            </div>
          )}
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t 
                      from-black/90 via-black/60 to-transparent transition-opacity duration-300" />
        
        {/* Minimal Info Overlay - Solo botón de información */}
        <div className="absolute bottom-4 right-4 text-white animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-300">
            {onShowProfile && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onShowProfile(user.id);
                }}
                className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-full 
                         flex items-center justify-center text-white 
                         hover:bg-gradient-to-r hover:from-purple-500/80 hover:to-orange-500/80 
                         transition-all duration-300 hover:scale-110 active:scale-95
                         shadow-lg border border-white/20 hover:shadow-xl hover:shadow-purple-500/25
                         group overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-orange-500 
                              opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full" />
                <Info className="w-4 h-4 sm:w-5 sm:h-5 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
              </button>
            )}
        </div>
      </div>

      {/* Content Section */}
      <div className="p-3 sm:p-4 md:p-6 pb-6 sm:pb-8 md:pb-10 bg-gradient-to-b from-transparent to-white/50 dark:to-gray-900/50 
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
          <div className="flex justify-center gap-6 sm:gap-8 mt-3 sm:mt-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-600 relative z-20">
            {/* Pass Button */}
            <Button
              variant="outline"
              size="lg"
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-gray-300 bg-white/90 backdrop-blur-sm
                       hover:border-red-400 hover:bg-red-50 hover:shadow-lg hover:shadow-red-500/25
                       transition-all duration-300 hover:scale-125 hover:-translate-y-1 group relative z-30
                       hover:shadow-2xl hover:shadow-red-500/40"
              onClick={() => {
                onPass?.(user.id);
              }}
            >
              <X className="w-4 h-4 sm:w-6 sm:h-6 text-gray-600 group-hover:text-red-500 transition-colors duration-300" />
            </Button>

            {/* Like Button */}
            <Button
              variant="outline"
              size="lg"
              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full border-2 border-pink-300 bg-gradient-to-br from-pink-50 to-red-50 backdrop-blur-sm
                       hover:border-pink-500 hover:from-pink-100 hover:to-red-100 hover:shadow-lg hover:shadow-pink-500/25
                       transition-all duration-300 hover:scale-125 hover:-translate-y-1 group relative overflow-hidden z-30
                       hover:shadow-2xl hover:shadow-pink-500/40"
              onClick={() => {
                onLike?.(user.id);
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-red-500 opacity-0 
                            group-hover:opacity-20 transition-opacity duration-300" />
              <Heart className="w-4 h-4 sm:w-6 sm:h-6 text-pink-600 group-hover:text-pink-700 transition-colors duration-300 
                              group-hover:scale-110 relative z-10" />
            </Button>
          </div>
        )}

        {/* User Information Section - Después de los botones */}
        <div className="mt-6 space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500 delay-300">
          {/* Nombre, edad y orientación sexual */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 
                           bg-clip-text text-transparent
                           hover:from-orange-500 hover:to-purple-600 transition-all duration-300">
                {user.name}{user.age ? `, ${user.age}` : ''}
              </h3>
              {user.sexualRole && (
                <SexualRoleIcon 
                  role={user.sexualRole as 'active' | 'passive' | 'versatile'} 
                  size="md"
                />
              )}
            </div>
            
            {/* Distancia */}
            {user.distance && (
              <div className="flex items-center justify-center text-sm text-gray-600 mb-2
                            hover:text-gray-800 transition-colors duration-300">
                <MapPin className="w-4 h-4 mr-1 text-orange-500" />
                {formatDistance(user.distance)}
              </div>
            )}

            {/* Sexual Role */}
            {user.sexualRole && (
              <div className="flex items-center justify-center mb-2">
                <div className={cn(
                  'w-3 h-3 rounded-full mr-2 shadow-lg flex-shrink-0',
                  getSexualRoleColor(user.sexualRole)
                )} />
                <span className="text-sm text-gray-700 font-medium">
                  {getSexualRoleLabel(user.sexualRole)}
                </span>
              </div>
            )}

            {/* Last Seen */}
            {!user.isOnline && user.lastSeen && (
              <p className="text-xs text-gray-500 font-medium">
                {formatLastSeen(user.lastSeen)}
              </p>
            )}
          </div>

          {/* Biography */}
          {user.bio && (
            <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-500">
              <p className="text-gray-700 text-sm leading-relaxed text-center
                          hover:text-gray-900 transition-colors duration-300">
                {user.bio}
              </p>
            </div>
          )}

          {/* Interests */}
          {user.interests && user.interests.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-500">
              {user.interests.map((interest, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gradient-to-r from-orange-100 to-purple-100 
                           rounded-full text-xs text-gray-700 border border-orange-200
                           hover:from-orange-200 hover:to-purple-200 hover:scale-105 
                           transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/25"
                  style={{ animationDelay: `${600 + index * 100}ms` }}
                >
                  {interest}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiscoverCard;