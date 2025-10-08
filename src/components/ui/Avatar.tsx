'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  fallback?: string;
  online?: boolean;
  onClick?: () => void;
}

const sizeClasses = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-16 h-16',
  '2xl': 'w-20 h-20'
};

const iconSizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-10 h-10'
};

const onlineIndicatorSizes = {
  xs: 'w-1.5 h-1.5 -bottom-0 -right-0',
  sm: 'w-2 h-2 -bottom-0 -right-0',
  md: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5',
  lg: 'w-3 h-3 -bottom-0.5 -right-0.5',
  xl: 'w-4 h-4 -bottom-1 -right-1',
  '2xl': 'w-5 h-5 -bottom-1 -right-1'
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = 'Avatar',
  size,
  className,
  fallback,
  online = false,
  onClick
}) => {
  const [imageError, setImageError] = React.useState(false);
  const [imageLoading, setImageLoading] = React.useState(true);

  

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const showFallback = !src || imageError;

  return (
    <div 
      className={cn(
        'relative inline-block overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800',
        size && sizeClasses[size],
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
    >
      {!showFallback ? (
        <>
          <Image
            src={src!}
            alt={alt}
            fill
            className={cn(
              'object-cover transition-opacity duration-200',
              imageLoading ? 'opacity-0' : 'opacity-100'
            )}
            onError={handleImageError}
            onLoad={handleImageLoad}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          {imageLoading && (
            <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
          )}
        </>
      ) : (
        <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400">
          {fallback ? (
            <span className={cn(
              'font-bold text-white drop-shadow-lg',
              size === 'xs' && 'text-xs',
              size === 'sm' && 'text-sm',
              size === 'md' && 'text-base',
              size === 'lg' && 'text-lg',
              size === 'xl' && 'text-xl',
              size === '2xl' && 'text-2xl',
              !size && 'text-2xl'
            )}>
              {fallback}
            </span>
          ) : (
            <div className="flex items-center justify-center w-full h-full bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400">
              <User className={cn(
                'text-white/80 drop-shadow-lg',
                size && iconSizeClasses[size],
                !size && 'w-8 h-8'
              )} />
            </div>
          )}
        </div>
      )}

      {/* Online indicator */}
      {online !== undefined && (
        <div className={cn(
          'absolute rounded-full border-2 border-white dark:border-gray-900',
          size && onlineIndicatorSizes[size],
          !size && 'w-4 h-4 bottom-0 right-0',
          online ? 'bg-green-500' : 'bg-gray-400'
        )} />
      )}
    </div>
  );
};

export default Avatar;