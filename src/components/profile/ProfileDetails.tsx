'use client';

import { useState } from 'react';
import Image from 'next/image';
import { User } from '@/types';
import { Button, Badge, Modal } from '@/components/ui';
import { 
  Heart, 
  X, 
  Star, 
  MapPin, 
  Clock, 
  Shield, 
  Crown,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Flag,
  Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getUserAllPhotos, userHasPhotos } from '@/lib/userUtils';

export interface ProfileDetailsProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onLike?: () => void;
  onPass?: () => void;
  onSuperLike?: () => void;
  onMessage?: () => void;
  onReport?: () => void;
  className?: string;
}

export function ProfileDetails({
  user,
  isOpen,
  onClose,
  onLike,
  onPass,
  onSuperLike,
  onMessage,
  onReport,
  className
}: ProfileDetailsProps) {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const allPhotos = getUserAllPhotos(user);

  const nextPhoto = () => {
    if (currentPhotoIndex < allPhotos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const formatLastSeen = (lastSeen: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - lastSeen.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Activo ahora';
    if (diffInMinutes < 60) return `Activo hace ${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `Activo hace ${Math.floor(diffInMinutes / 60)}h`;
    return `Activo hace ${Math.floor(diffInMinutes / 1440)}d`;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="relative h-full">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20"
              >
                <Share2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onReport}
                className="text-white hover:bg-white/20"
              >
                <Flag className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Photo Carousel */}
        <div className="relative h-96 bg-gray-200">
          {userHasPhotos(user) ? (
            <>
              <Image
                src={allPhotos[currentPhotoIndex] || ''}
                alt={`${user.name} - Foto ${currentPhotoIndex + 1}`}
                fill
                className="object-cover"
                priority={currentPhotoIndex === 0}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              
              {/* Photo Navigation */}
              {allPhotos.length > 1 && (
                <>
                  <button
                    onClick={prevPhoto}
                    disabled={currentPhotoIndex === 0}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={nextPhoto}
                    disabled={currentPhotoIndex === allPhotos.length - 1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/30 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  
                  {/* Photo Indicators */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1">
                    {allPhotos.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentPhotoIndex(index)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-colors",
                          index === currentPhotoIndex ? "bg-white" : "bg-white/50"
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-200">
              <span className="text-gray-500">Sin fotos</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[calc(90vh-24rem)] overflow-y-auto">
          {/* Basic Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold">{user.name}</h1>
                <span className="text-xl text-gray-600">{user.age}</span>
                {user.isOnline && (
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                )}
              </div>
              <div className="flex items-center space-x-1">
                {user.isPremium && (
                  <Badge variant="gold" size="sm">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                )}
                {user.isVerified && (
                  <Badge variant="primary" size="sm">
                    <Shield className="w-3 h-3 mr-1" />
                    Verificado
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-600">
              {user.distance && (
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{user.distance} km</span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{formatLastSeen(user.lastSeen.toDate())}</span>
              </div>
            </div>
          </div>

          {/* Sexual Role */}
          {user.sexualRole && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Rol</h3>
              <Badge variant="outline" size="sm">
                {user.sexualRole === 'active' ? 'Activo' : 
                 user.sexualRole === 'passive' ? 'Pasivo' : 
                 user.sexualRole === 'versatile' ? 'Versátil' : 'Otro'}
              </Badge>
            </div>
          )}

          {/* Bio */}
          {user.bio && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Sobre mí</h3>
              <p className="text-gray-700 leading-relaxed">{user.bio}</p>
            </div>
          )}

          {/* Interests */}
          {user.interests && user.interests.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Intereses</h3>
              <div className="flex flex-wrap gap-2">
                {user.interests.map((interest, index) => (
                  <Badge key={index} variant="secondary" size="sm">
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Location */}
          {user.location && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-1">Ubicación</h3>
              <p className="text-gray-700">
                {user.location.city && user.location.country 
                  ? `${user.location.city}, ${user.location.country}`
                  : user.location.city || user.location.country || 'Ubicación no disponible'
                }
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-white border-t">
          <div className="flex items-center justify-center space-x-3 sm:space-x-4">
            <Button
              variant="outline"
              size="lg"
              onClick={onPass}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full p-0 border-red-200 hover:border-red-300 hover:bg-red-50 flex items-center justify-center"
            >
              <div className="flex items-center justify-center w-full h-full"></div>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={onMessage}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full p-0 border-blue-200 hover:border-blue-300 hover:bg-blue-50 flex items-center justify-center"
            >
              <div className="flex items-center justify-center w-full h-full"></div>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={onLike}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full p-0 border-green-200 hover:border-green-300 hover:bg-green-50 flex items-center justify-center"
            >
              <div className="flex items-center justify-center w-full h-full"></div>
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              onClick={onSuperLike}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full p-0 border-yellow-200 hover:border-yellow-300 hover:bg-yellow-50 flex items-center justify-center"
            >
              <div className="flex items-center justify-center w-full h-full">
                <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />
              </div>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}