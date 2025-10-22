'use client';

import React, { useState } from 'react';
import { User } from '@/types';
import { X, MapPin, Heart, Star, MessageCircle, Shield, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn, calculateAge } from '@/lib/utils';
import { formatDistance } from '@/lib/geolocation';
import { getUserAllPhotos } from '@/lib/userUtils';
import SexualRoleIcon from '@/components/ui/SexualRoleIcon';
import { VerificationBadge } from '@/components/verification';

interface UserDetailModalProps {
  userDistance: { user: User; distance: number };
  isOpen: boolean;
  onClose: () => void;
  onLike?: (userId: string) => void;
  onBlock?: (userId: string) => void;
  onSuperLike?: (userId: string) => void;
  onStartChat?: (userId: string) => void;
}

export const UserDetailModal: React.FC<UserDetailModalProps> = ({
  userDistance,
  isOpen,
  onClose,
  onLike,
  onBlock,
  onSuperLike,
  onStartChat
}) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const { user, distance } = userDistance;
  const age = user.age || null;
  const allPhotos = getUserAllPhotos(user);

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % allPhotos.length);
    setImageError(false);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative w-full h-full max-w-md mx-auto bg-white dark:bg-gray-900 overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-black/70 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Photo section */}
        <div className="relative h-2/3 overflow-hidden">
          {allPhotos.length > 0 && !imageError ? (
            <>
              <img
                src={allPhotos[currentPhotoIndex]}
                alt={`${user.name} - Foto ${currentPhotoIndex + 1}`}
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
              
              {/* Photo navigation */}
              {allPhotos.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextPhoto}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  
                  {/* Photo indicators */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-1">
                    {allPhotos.map((_, index) => (
                      <div
                        key={index}
                        className={cn(
                          'w-2 h-2 rounded-full transition-colors',
                          index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-100 to-orange-100 dark:from-purple-900/30 dark:to-orange-900/30">
              <div className="text-center">
                <div className="w-20 h-20 bg-white/50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">👤</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Sin foto de perfil</p>
              </div>
            </div>
          )}

          {/* Status indicators */}
          {user.isOnline && (
            <div className="absolute top-4 left-4">
              <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse" />
            </div>
          )}

          {user.isPremium && (
            <div className="absolute top-4 left-4" style={{ marginLeft: user.isOnline ? '2rem' : '0' }}>
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg flex items-center backdrop-blur-sm">
                <Star className="w-4 h-4 mr-1" />
                PREMIUM
              </div>
            </div>
          )}
        </div>

        {/* User details section */}
        <div className="h-1/3 p-6 overflow-y-auto">
          {/* Name and basic info */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                {user.name}
              </h2>
              {user.sexualRole && (
                <SexualRoleIcon 
                  role={user.sexualRole as 'active' | 'passive' | 'versatile'} 
                  size="lg"
                />
              )}
              <VerificationBadge 
                verificationLevel={user.verificationLevel || 'basic'} 
                size="md" 
                showText={false}
              />
            </div>
            {age && (
              <span className="text-2xl font-bold text-gray-700 dark:text-gray-300 ml-3">
                {age}
              </span>
            )}
          </div>

          {/* Distance */}
          {distance !== undefined && (
            <div className="flex items-center text-gray-600 dark:text-gray-400 mb-4">
              <MapPin className="w-4 h-4 mr-2" />
              <span>{formatDistance(distance)}</span>
            </div>
          )}

          {/* Bio */}
          {user.bio && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Sobre mí</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {user.bio}
              </p>
            </div>
          )}

          {/* Interests */}
          {user.interests && user.interests.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Intereses</h3>
              <div className="flex flex-wrap gap-2">
                {user.interests.map((interest, index) => (
                  <span 
                    key={index} 
                    className="bg-gradient-to-r from-purple-100 to-orange-100 dark:from-purple-900/30 dark:to-orange-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-sm font-medium border border-purple-200 dark:border-purple-600"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-center space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => onBlock?.(user.id)}
              className="w-12 h-12 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full flex items-center justify-center transition-colors shadow-md hover:shadow-lg"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            
            {onStartChat && (
              <button
                onClick={() => onStartChat(user.id)}
                className="w-12 h-12 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center transition-colors shadow-md hover:shadow-lg"
              >
                <MessageCircle className="w-5 h-5 text-white" />
              </button>
            )}
            
            <button
              onClick={() => onSuperLike?.(user.id)}
              className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg"
            >
              <Star className="w-5 h-5 text-white" />
            </button>
            
            <button
              onClick={() => onLike?.(user.id)}
              className="w-12 h-12 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg"
            >
              <Heart className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;