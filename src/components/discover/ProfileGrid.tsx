'use client';

import React, { useState } from 'react';
import { Heart, MessageCircle, Star, Ban, MapPin, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserDistance } from '@/types';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getUserProfilePhoto } from '@/lib/userUtils';

interface ProfileGridProps {
  users: UserDistance[];
  onLike?: (userId: string) => void;
  onSuperLike?: (userId: string) => void;
  onBlock?: (userId: string) => void;
  onStartChat?: (userId: string) => void;
  className?: string;
}

interface ProfileCardProps {
  userDistance: UserDistance;
  onLike?: (userId: string) => void;
  onSuperLike?: (userId: string) => void;
  onBlock?: (userId: string) => void;
  onStartChat?: (userId: string) => void;
  onClick?: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  userDistance,
  onLike,
  onSuperLike,
  onBlock,
  onStartChat,
  onClick
}) => {
  const { user, distance } = userDistance;
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const getDisplayAge = () => {
    return user.age || 'N/A';
  };

  const handleAction = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div
      className={cn(
        "relative bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer",
        "transform transition-all duration-300 hover:scale-105 hover:shadow-xl",
        "group"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      {/* Profile Image */}
      <div className="relative aspect-[4/5] overflow-hidden">
        {getUserProfilePhoto(user) ? (
          <Image
            src={getUserProfilePhoto(user) || ''}
            alt={user.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(false)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <div className="text-gray-500 text-4xl">👤</div>
          </div>
        )}
        
        {/* Loading skeleton */}
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}

        {/* Premium badge */}
        {user.isPremium && (
          <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
            ✨ Premium
          </div>
        )}

        {/* Online indicator */}
        {user.isOnline && (
          <div className="absolute top-2 left-2 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
        )}

        {/* Action buttons overlay */}
        <div className={cn(
          "absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center",
          "transition-opacity duration-300",
          isHovered ? "opacity-100" : "opacity-0"
        )}>
          <div className="flex space-x-3">
            {/* Chat button */}
            <button
              onClick={(e) => handleAction(e, () => onStartChat?.(user.id))}
              className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full transition-all duration-200 transform hover:scale-110"
              title="Iniciar chat"
            >
              <MessageCircle size={20} />
            </button>

            {/* Like button */}
            <button
              onClick={(e) => handleAction(e, () => onLike?.(user.id))}
              className="bg-pink-500 hover:bg-pink-600 text-white p-3 rounded-full transition-all duration-200 transform hover:scale-110"
              title="Dar like"
            >
              <Heart size={20} />
            </button>

            {/* Super like button */}
            <button
              onClick={(e) => handleAction(e, () => onSuperLike?.(user.id))}
              className="bg-purple-500 hover:bg-purple-600 text-white p-3 rounded-full transition-all duration-200 transform hover:scale-110"
              title="Super like"
            >
              <Star size={20} />
            </button>

            {/* Block button */}
            <button
              onClick={(e) => handleAction(e, () => onBlock?.(user.id))}
              className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transition-all duration-200 transform hover:scale-110"
              title="Bloquear usuario"
            >
              <Ban size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg text-gray-900 truncate">
            {user.name || 'Usuario'}
          </h3>
          {user.age && (
            <span className="text-gray-600 text-sm flex items-center">
              <Calendar size={14} className="mr-1" />
              {getDisplayAge()}
            </span>
          )}
        </div>

        {/* Distance */}
        <div className="flex items-center text-gray-500 text-sm mb-2">
          <MapPin size={14} className="mr-1" />
          <span>{Math.round(distance)} km</span>
        </div>

        {/* Bio preview */}
        {user.bio && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-2">
            {user.bio}
          </p>
        )}

        {/* Interests */}
        {user.interests && user.interests.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {user.interests.slice(0, 3).map((interest, index) => (
              <span
                key={index}
                className="bg-pink-100 text-pink-700 px-2 py-1 rounded-full text-xs"
              >
                {interest}
              </span>
            ))}
            {user.interests.length > 3 && (
              <span className="text-gray-500 text-xs">
                +{user.interests.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const ProfileGrid: React.FC<ProfileGridProps> = ({
  users,
  onLike,
  onSuperLike,
  onBlock,
  onStartChat,
  className
}) => {
  const router = useRouter();

  const handleProfileClick = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 text-6xl mb-4">💔</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">
          No hay más perfiles
        </h3>
        <p className="text-gray-500">
          Intenta ajustar tus filtros para ver más personas
        </p>
      </div>
    );
  }

  return (
    <div className={cn(
      "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",
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
        />
      ))}
    </div>
  );
};

export default ProfileGrid;